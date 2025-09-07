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
        fetch("http://localhost:5000/api/roles")
      ]);

      const branchesData = branchesResponse.ok ? await branchesResponse.json() : [];
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
      ws['!cols'] = colWidths;

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Users");

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
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
      className={`transition-all duration-300 ${isCollapsed ? "ml-5" : "ml-1"
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full sm:w-40 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="All">All Branches</option>
            </select>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              <Plus size={16} />
              Add User
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300"
            >
              <Download size={16} />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <tr key={user.user_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <input
                            type="text"
                            name="name"
                            defaultValue={user.name}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          user.name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <input
                            type="text"
                            name="contact"
                            defaultValue={user.contact}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.role_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          user.role_name || "N/A"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <select
                            name="branch_id"
                            defaultValue={user.branch_id}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            {branches.map((branch) => (
                              <option key={branch.id} value={branch.id}>
                                {branch.location}
                              </option>
                            ))}
                          </select>
                        ) : (
                          user.branch_name || "N/A"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <select
                            name="status"
                            defaultValue={user.status}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                              : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                              }`}
                          >
                            {user.status || "Active"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdate(user.user_id)}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setIsEditMode(false);
                                setEditedUser({});
                              }}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditedUser(user);
                                setIsEditMode(true);
                              }}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setUserIdToDelete(user.user_id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
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
                      className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
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
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        currentPage * itemsPerPage,
                        filteredUsers.length
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{filteredUsers.length}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${currentPage === 1
                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        : "text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }`}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200"
                            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
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
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${currentPage === totalPages
                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                        : "text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Confirm Delete
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Add New User
            </h2>

            <div className="grid grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  if (!isAddingUser) {
                    setIsAddModalOpen(false);
                  }
                }}
                disabled={isAddingUser}
                className={`py-2 px-4 rounded-lg transition duration-300 ${isAddingUser
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-500 hover:bg-gray-600"
                  } text-white`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={isAddingUser}
                className={`flex items-center gap-2 py-2 px-4 rounded-lg transition duration-300 ${isAddingUser
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                  } text-white`}
              >
                {isAddingUser ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
