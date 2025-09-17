import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "react-toastify/dist/ReactToastify.css";
import { useSidebar } from "../Sidebar/SidebarContext";
import {
  ArrowLeft,
  Search,
  Download,
  Plus,
  Edit,
  Trash2Icon,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";

// Define interface for User data
interface User {
  user_id: string; // Changed from number to string (UUID)
  name: string;
  contact: string;
  email: string;
  status: "Active" | "Inactive";
  branch_id: string;
  role_id: number;
  password?: string;
  role?: {
    role_name: string;
  };
  branch_name?: string;
  role_name?: string;
}

function UserManagement() {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();

  // State management
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isAddingUser, setIsAddingUser] = useState<boolean>(false);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [branchFilter, setBranchFilter] = useState<string>("All");

  const itemsPerPage = 5;

  const [newUser, setNewUser] = useState<Omit<User, "user_id">>({
    name: "",
    contact: "",
    email: "",
    status: "Active",
    role_id: 1, // Default role ID
    branch_id: "",
  });

  //Fetch branches from supabase
  const [branches, setBranches] = useState<{ id: string; location: string }[]>(
    []
  );
  const [roles, setRoles] = useState<{ id: number; role_name: string }[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/get_users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();

      // Get branch and role information separately
      const [branchesResponse, rolesResponse] = await Promise.all([
        fetch("http://localhost:5000/api/branches"),
        fetch("http://localhost:5000/api/roles"),
      ]);

      const branchesData = branchesResponse.ok
        ? await branchesResponse.json()
        : [];
      const rolesData = rolesResponse.ok ? await rolesResponse.json() : [];

      // Join user data with branch and role information
      const usersWithInfo = data.map((user: User) => {
        const branch = branchesData.find((b: any) => b.id === user.branch_id);
        const role = rolesData.find((r: any) => r.id === user.role_id);

        return {
          ...user,
          branch_name: branch?.location || "N/A",
          role_name: role?.role_name || "N/A",
        };
      });

      setUsers(usersWithInfo);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  };

  // Fetch roles from API
  useEffect(() => {
    async function fetchRoles() {
      try {
        const response = await fetch("http://localhost:5000/api/roles");
        if (response.ok) {
          const data = await response.json();
          setRoles(data || []);
          if (data && data.length > 0) {
            setNewUser((prev) => ({ ...prev, role_id: data[0].id }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    }
    fetchRoles();
  }, []);

  useEffect(() => {
    async function fetchBranches() {
      try {
        const response = await fetch("http://localhost:5000/api/branches");
        if (response.ok) {
          const data = await response.json();
          setBranches(data || []);
          if (data && data.length > 0) {
            setNewUser((prev) => ({ ...prev, branch_id: data[0].id }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch branches:", error);
      }
    }
    fetchBranches();
    fetchUsers(); // Fetch users when component mounts
  }, []);

  // Filter users based on search term and branch
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = Object.values(user).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesBranch =
        branchFilter === "All" || user.branch_id === branchFilter;

      return matchesSearch && matchesBranch;
    });
  }, [users, searchTerm, branchFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Handle input changes in edit mode
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    userId?: string
  ) => {
    const { name, value } = e.target;

    if (userId) {
      // Editing existing user
      setEditedUser((prev) => ({ ...prev, [name]: value }));
      setUsers(
        users.map((user) =>
          user.user_id === userId ? { ...user, [name]: value } : user
        )
      );
    } else {
      // Adding new user
      setNewUser((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle updating the user
  const handleUpdate = async (userId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...editedUser,
            user_id: userId, // Include user_id in the update payload
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      // Refresh the user list
      await fetchUsers();
      setIsEditMode(false);
      setEditedUser({});
      toast.success("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update user"
      );
    }
  };

  // Handle deleting the user
  const handleDelete = async () => {
    if (!userIdToDelete) return;

    try {
      console.log("Deleting user with ID:", userIdToDelete); // Debug log
      const response = await fetch(
        `http://localhost:5000/api/users/${userIdToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      // Refresh the user list
      await fetchUsers();
      setIsDeleteModalOpen(false);
      setUserIdToDelete(null);
      toast.success("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user"
      );
      setIsDeleteModalOpen(false);
      setUserIdToDelete(null);
    }
  };

  // Add new user (New flow - creates pending user)
  const handleAddUser = async () => {
    // Validate required fields
    if (
      !newUser.name ||
      !newUser.email ||
      !newUser.contact ||
      !newUser.role_id
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate contact number format
    const cleanContact = newUser.contact.replace(/\D/g, "").slice(0, 11);
    if (cleanContact.length !== 11) {
      toast.error("Contact number must be exactly 11 digits");
      return;
    }
    if (!/^09\d{9}$/.test(cleanContact)) {
      toast.error("Contact number must start with 09");
      return;
    }

    setIsAddingUser(true);
    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        contact: cleanContact,
        role_id: newUser.role_id,
        branch_id: newUser.branch_id,
        status: newUser.status || "Active",
      };

      console.log("Creating pending user with data:", userData);

      const response = await fetch(
        "http://localhost:5000/api/create_pending_user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Server error response:", data);
        throw new Error(
          data.error || data.message || "Failed to create pending user"
        );
      }

      // Show success message with setup link
      toast.success("Pending user created successfully!");

      // Show setup link and email info in console for development
      console.log("Setup link:", data.setupLink);
      if (data.emailPreview) {
        console.log("Email preview:", data.emailPreview);
        toast.success(`Email sent! Preview: ${data.emailPreview}`, {
          duration: 15000,
        });
      }

      // Refresh the user list
      await fetchUsers();

      setIsAddModalOpen(false);
      setNewUser({
        name: "",
        contact: "",
        email: "",
        status: "Active",
        role_id: roles[0]?.id || 1,
        branch_id: branches[0]?.id || "",
      });
    } catch (error) {
      console.error("Error creating pending user:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create pending user";
      toast.error(errorMessage);
    } finally {
      setIsAddingUser(false);
    }
  };

  // Add input validation for contact number
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 11);
    setNewUser((prev) => ({
      ...prev,
      contact: value,
    }));
  };

  // Export users to Excel
  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredUsers.map((user) => ({
        Name: user.name,
        Contact: user.contact,
        Email: user.email,
        Role: user.role_name || "N/A",
        Branch: user.branch_name || "N/A",
        Status: user.status || "Active",
      }));

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Create a worksheet from the data
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Name
        { wch: 15 }, // Contact
        { wch: 30 }, // Email
        { wch: 15 }, // Role
        { wch: 20 }, // Branch
        { wch: 10 }, // Status
      ];
      ws["!cols"] = colWidths;

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Users");

      // Generate filename with current date
      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `users_export_${currentDate}.xlsx`;

      // Save the file
      XLSX.writeFile(wb, filename);

      toast.success(`Users exported successfully as ${filename}`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export users to Excel");
    }
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
    >
      <div className="p-2">
        {/* Toaster for success and error */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h5 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h5>
        </div>

        {/* Search, Branch Filter and Export Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                className="
          w-full pl-10 pr-4 py-3 rounded-2xl font-semibold text-base
          text-gray-800 dark:text-gray-100
          bg-gray-50 dark:bg-gray-800
          shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.6)]
          dark:shadow-[6px_6px_12px_rgba(0,0,0,0.7),-6px_-6px_12px_rgba(40,40,40,0.6)]
          hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.15),inset_-6px_-6px_12px_rgba(255,255,255,0.6)]
          dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.6),inset_-6px_-6px_12px_rgba(30,30,30,0.4)]
          focus:outline-none focus:ring-2 focus:ring-blue-500/50
          transition-all duration-300
        "
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="
        w-full sm:w-auto px-6 py-3 rounded-2xl font-semibold text-base
        text-gray-800 dark:text-gray-100
        bg-gray-50 dark:bg-gray-800
        shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.6)]
        dark:shadow-[6px_6px_12px_rgba(0,0,0,0.7),-6px_-6px_12px_rgba(40,40,40,0.6)]
        hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.15),inset_-6px_-6px_12px_rgba(255,255,255,0.6)]
        dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.6),inset_-6px_-6px_12px_rgba(30,30,30,0.4)]
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
        transition-all duration-300
      "
            >
              <option value="All">All Branches</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="
        flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-base
        text-green-600 dark:text-green-400
        bg-transparent
        shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.6)]
        dark:shadow-[6px_6px_12px_rgba(0,0,0,0.7),-6px_-6px_12px_rgba(40,40,40,0.6)]
        hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.2),inset_-6px_-6px_12px_rgba(255,255,255,0.5)]
        dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.6),inset_-6px_-6px_12px_rgba(30,30,30,0.4)]
        hover:scale-[1.05] active:scale-95
        transition-all duration-300
      "
            >
              <Plus size={16} />
              Add User
            </button>

            <button
              onClick={exportToExcel}
              className="
        flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-base
        text-blue-600 dark:text-blue-400
        bg-transparent
        shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.6)]
        dark:shadow-[6px_6px_12px_rgba(0,0,0,0.7),-6px_-6px_12px_rgba(40,40,40,0.6)]
        hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.2),inset_-6px_-6px_12px_rgba(255,255,255,0.5)]
        dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.6),inset_-6px_-6px_12px_rgba(30,30,30,0.4)]
        hover:scale-[1.05] active:scale-95
        transition-all duration-300
      "
            >
              <Download size={16} />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r text-base text-bold from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-blue-200">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-blue-200">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-blue-200">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-blue-200">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-blue-200">
                    Branch
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-blue-200">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-blue-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, idx) => (
                    <tr
                      key={user.user_id}
                      className={`group transition-colors font-semibold${
                        idx % 2 === 0
                          ? "bg-white dark:bg-gray-800"
                          : "bg-gray-50 dark:bg-gray-800"
                      } hover:bg-gray-100 dark:hover:bg-gray-900`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <input
                            type="text"
                            name="name"
                            defaultValue={user.name}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="font-medium">{user.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <input
                            type="text"
                            name="contact"
                            defaultValue={user.contact}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          user.contact
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <input
                            type="email"
                            name="email"
                            defaultValue={user.email}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <select
                            name="role_id"
                            defaultValue={user.role_id}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.role_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {user.role_name || "N/A"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <select
                            name="branch_id"
                            defaultValue={user.branch_id}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            {branches.map((branch) => (
                              <option key={branch.id} value={branch.id}>
                                {branch.location}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                            {user.branch_name || "N/A"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <select
                            name="status"
                            defaultValue={user.status}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        ) : (
                          <span
                            className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${
                              user.status === "Active"
                                ? "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {user.status || "Active"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(user.user_id)}
                              className="px-3 py-1 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setIsEditMode(false);
                                setEditedUser({});
                              }}
                              className="px-3 py-1 rounded-lg bg-gray-400 text-white hover:bg-gray-500 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditedUser(user);
                                setIsEditMode(true);
                              }}
                              className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setUserIdToDelete(user.user_id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                              title="Delete"
                            >
                              <Trash2Icon size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-base text-gray-500 dark:text-gray-400"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="bg-white dark:bg-gray-900 px-4 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing{" "}
                <span className="font-semibold">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                </span>{" "}
                of <span className="font-semibold">{filteredUsers.length}</span>{" "}
                results
              </div>
              <nav className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition ${
                    currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition ${
                        currentPage === pageNum
                          ? "bg-blue-500 dark:bg-blue-700 text-white"
                          : "bg-white dark:bg-gray-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition ${
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>

          {/* Modal Card */}
          <div
            className="relative bg-gray-100 dark:bg-gray-900 rounded-2xl p-6 w-96
      shadow-[9px_9px_18px_rgba(0,0,0,0.25),-9px_-9px_18px_rgba(255,255,255,0.9)]
      dark:shadow-[9px_9px_18px_rgba(0,0,0,0.9),-9px_-9px_18px_rgba(40,40,40,0.5)]
      transition-all duration-300"
          >
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Confirm Delete
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>

            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300
          shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.8)]
          dark:shadow-[4px_4px_8px_rgba(0,0,0,0.7),-4px_-4px_8px_rgba(50,50,50,0.5)]
          hover:scale-[1.05] hover:text-gray-800 dark:hover:text-gray-100
          hover:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.6)]
          dark:hover:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.9),inset_-3px_-3px_6px_rgba(50,50,50,0.4)]
          transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold
          shadow-[4px_4px_8px_rgba(0,0,0,0.2),-4px_-4px_8px_rgba(255,255,255,0.7)]
          dark:shadow-[4px_4px_8px_rgba(0,0,0,0.9),-4px_-4px_8px_rgba(50,50,50,0.4)]
          hover:scale-[1.05] hover:bg-red-600
          hover:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]
          dark:hover:bg-red-600
          transition duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.6),-8px_-8px_16px_rgba(255,255,255,0.05)] transition-all duration-300">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Add New User
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Column 1 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Name *"
                    value={newUser.name}
                    onChange={(e) => handleInputChange(e)}
                    disabled={isAddingUser}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    value={newUser.email}
                    onChange={(e) => handleInputChange(e)}
                    disabled={isAddingUser}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newUser.contact}
                    onChange={handleContactChange}
                    placeholder="Enter 11-digit contact number"
                    disabled={isAddingUser}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Enter 11 digits (e.g., 09123456789)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Branch
                  </label>
                  <select
                    name="branch_id"
                    value={newUser.branch_id}
                    onChange={(e) => handleInputChange(e)}
                    disabled={isAddingUser}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="" disabled>
                      Select Branch *
                    </option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    name="role_id"
                    value={newUser.role_id}
                    onChange={(e) => handleInputChange(e)}
                    disabled={isAddingUser}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="" disabled>
                      Select Role *
                    </option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newUser.status}
                    onChange={(e) => handleInputChange(e)}
                    disabled={isAddingUser}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              {/* Cancel Button */}
              <button
                onClick={() => {
                  if (!isAddingUser) setIsAddModalOpen(false);
                }}
                disabled={isAddingUser}
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 
      ${
        isAddingUser
          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
          : "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
      }`}
              >
                Cancel
              </button>

              {/* Add User Button */}
              <button
                onClick={handleAddUser}
                disabled={isAddingUser}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium shadow-md transition-all duration-300 
      ${
        isAddingUser
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
      }`}
              >
                {isAddingUser ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Adding...
                  </>
                ) : (
                  "Add User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
