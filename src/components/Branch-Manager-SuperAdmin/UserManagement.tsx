import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../../config/config";
import { useSidebar } from "../Sidebar/SidebarContext";
import {
  ArrowLeft,
  Search,
  Download,
  Plus,
  Edit,
  Trash2Icon,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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

const SUPER_ADMIN_ROLE_ID = 1;
const ADMIN_ROLE_NAME = "Admin";

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

  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  const [newUser, setNewUser] = useState<Omit<User, "user_id">>({
    name: "",
    contact: "",
    email: "",
    status: "Active",
    role_id: 0,
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
      const response = await fetch(`${API_BASE_URL}/api/get_users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();

      // Get branch and role information separately
      const [branchesResponse, rolesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/branches`),
        fetch(`${API_BASE_URL}/api/roles`),
      ]);

      const branchesData = branchesResponse.ok
        ? await branchesResponse.json()
        : [];
      const rolesData = rolesResponse.ok ? await rolesResponse.json() : [];

      // Join user data with branch and role information
      const usersWithInfo = data.map((user: User) => {
        // Convert both to string for comparison to handle type mismatches
        const branch = branchesData.find((b: any) => String(b.id) === String(user.branch_id));
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

  const superAdminExists = useMemo(
    () => users.some((user) => user.role_id === SUPER_ADMIN_ROLE_ID),
    [users]
  );

  const availableRoles = useMemo(
    () =>
      roles.filter(
        (role) =>
          role.id !== SUPER_ADMIN_ROLE_ID &&
          role.role_name?.toLowerCase() !== ADMIN_ROLE_NAME.toLowerCase()
      ),
    [roles]
  );

  const pickDefaultRoleId = useCallback(
    (roleList: { id: number; role_name: string }[]) =>
      roleList.find((role) => role.id !== SUPER_ADMIN_ROLE_ID)?.id ??
      roleList[0]?.id ??
      SUPER_ADMIN_ROLE_ID,
    []
  );

  // Fetch roles from API
  useEffect(() => {
    async function fetchRoles() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/roles`);
        if (response.ok) {
          const data = (await response.json()) || [];
          setRoles(data);
          if (data.length > 0) {
            const defaultRoleId = pickDefaultRoleId(data);
            setNewUser((prev) => ({ ...prev, role_id: defaultRoleId }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    }
    fetchRoles();
  }, [pickDefaultRoleId]);

  useEffect(() => {
    async function fetchBranches() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/branches`);
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
    return users
      .filter((user) => user.role_id !== SUPER_ADMIN_ROLE_ID)
      .filter((user) => {
        const matchesSearch = Object.values(user).some(
          (value) =>
            typeof value === "string" &&
            value.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Convert both to string for comparison to handle type mismatches
        const matchesBranch =
          branchFilter === "All" || String(user.branch_id) === String(branchFilter);

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
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editedUser,
          user_id: userId, // Include user_id in the update payload
        }),
      });

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
        `${API_BASE_URL}/api/users/${userIdToDelete}`,
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

    if (newUser.role_id === SUPER_ADMIN_ROLE_ID && superAdminExists) {
      toast.error("A super admin already exists");
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

      const response = await fetch(`${API_BASE_URL}/api/create_pending_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

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
        role_id:
          pickDefaultRoleId(roles) ?? roles[0]?.id ?? SUPER_ADMIN_ROLE_ID,
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
      if (filteredUsers.length === 0) {
        toast.error("No users to export");
        return;
      }

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

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const halfVisiblePages = Math.floor(maxVisiblePages / 2);
      let startPage = currentPage - halfVisiblePages;
      let endPage = currentPage + halfVisiblePages;

      if (startPage < 1) {
        endPage += 1 - startPage;
        startPage = 1;
      }

      if (endPage > totalPages) {
        startPage -= endPage - totalPages;
        endPage = totalPages;
      }

      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
          pageNumbers.push(-1); // Ellipsis
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(-1); // Ellipsis
        }
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 dark:bg-gray-900/70 min-h-screen`}
    >
      <div className="w-full px-2 sm:px-4 py-6 bg-white dark:bg-gray-900 rounded-2xl mb-4 shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] transition-all duration-300">
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center px-3 rounded-xl text-gray-800 dark:text-gray-200 transition-all duration-200"
            >
              <ArrowLeft size={20} className="mr-1" />
            </button>
            <h5 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              User Management
            </h5>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center">
              <label
                htmlFor="itemsPerPage"
                className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
              >
                Items per page:
              </label>
              <select
                id="itemsPerPage"
                className="border border-gray-300 dark:border-gray-900 rounded-xl px-3 py-2 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-[inset_4px_4px_8px_rgba(0,0,0,0.08),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.05)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={exportToExcel}
              disabled={filteredUsers.length === 0}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-green-700 dark:text-green-500 shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] hover:scale-[1.05] active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to Excel"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Search, Branch Filter and Add User Button */}
        <div className="mt-3.5 p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] transition-all">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  className="block w-full pl-10 pr-3 py-2 rounded-xl 
                    bg-white dark:bg-gray-900 border border-transparent
                    text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300
                    shadow-[inset_4px_4px_8px_rgba(0,0,0,0.08),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] 
                    dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]
                    focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm
                    transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Branch Filter */}
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 rounded-xl 
                    bg-white dark:bg-gray-900 border border-transparent
                    text-gray-900 dark:text-white
                    shadow-[inset_4px_4px_8px_rgba(0,0,0,0.08),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] 
                    dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]
                    focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm
                    transition-all"
                >
                  <option value="All">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add User Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-blue-700 dark:text-blue-500 shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] hover:scale-[1.05] active:scale-[0.97] transition-all duration-200"
              title="Add User"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add User</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-900 shadow sm:rounded-lg mt-3.5 w-full">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    scope="col"
                    className="w-40 px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="w-32 px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="w-48 px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="w-32 px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="w-32 px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Branch
                  </th>
                  <th
                    scope="col"
                    className="w-24 px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="w-32 px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <tr
                      key={user.user_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-4">
                        <div className="text-base font-medium text-gray-900 dark:text-white">
                          {isEditMode && editedUser.user_id === user.user_id ? (
                            <input
                              type="text"
                              name="name"
                              defaultValue={user.name}
                              onChange={(e) =>
                                handleInputChange(e, user.user_id)
                              }
                              className="w-full px-2 py-1 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="font-medium">{user.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-base text-gray-900 dark:text-white">
                          {isEditMode && editedUser.user_id === user.user_id ? (
                            <input
                              type="text"
                              name="contact"
                              defaultValue={user.contact}
                              onChange={(e) =>
                                handleInputChange(e, user.user_id)
                              }
                              className="w-full px-2 py-1 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            user.contact
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-base text-gray-900 dark:text-white break-words">
                          {isEditMode && editedUser.user_id === user.user_id ? (
                            <input
                              type="email"
                              name="email"
                              defaultValue={user.email}
                              onChange={(e) =>
                                handleInputChange(e, user.user_id)
                              }
                              className="w-full px-2 py-1 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            user.email
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-base text-gray-900 dark:text-white">
                          {isEditMode && editedUser.user_id === user.user_id ? (
                            <select
                              name="role_id"
                              defaultValue={user.role_id}
                              onChange={(e) =>
                                handleInputChange(e, user.user_id)
                              }
                              className="w-full px-2 py-1 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                              {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.role_name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-block px-3 py-1.5 text-sm font-semibold rounded-lg shadow-sm border-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700">
                              {user.role_name || "N/A"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-base text-gray-900 dark:text-white">
                          {isEditMode && editedUser.user_id === user.user_id ? (
                            <select
                              name="branch_id"
                              defaultValue={user.branch_id}
                              onChange={(e) =>
                                handleInputChange(e, user.user_id)
                              }
                              className="w-full px-2 py-1 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                              {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                  {branch.location}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-block px-3 py-1.5 text-sm font-semibold rounded-lg shadow-sm border-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700">
                              {user.branch_name || "N/A"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-base">
                          {isEditMode && editedUser.user_id === user.user_id ? (
                            <select
                              name="status"
                              defaultValue={user.status}
                              onChange={(e) =>
                                handleInputChange(e, user.user_id)
                              }
                              className="w-full px-2 py-1 border border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          ) : (
                            <span
                              className={`px-3 py-1.5 inline-flex text-sm font-semibold rounded-lg shadow-sm border-2 ${
                                user.status === "Active"
                                  ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700"
                                  : "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700"
                              }`}
                            >
                              {user.status || "Active"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
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
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
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
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => paginate(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">First</span>
                      <ChevronsLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {getPageNumbers().map((number, index) =>
                      number === -1 ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === number
                              ? "z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-300"
                              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                          }`}
                        >
                          {number}
                        </button>
                      )
                    )}

                    <button
                      onClick={() =>
                        paginate(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => paginate(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Last</span>
                      <ChevronsRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
              className="absolute inset-0"
              onClick={() => setIsDeleteModalOpen(false)}
            ></div>

            {/* Modal Card */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 w-96 transition-all duration-300">
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
                  className="px-4 py-2 rounded-xl font-semibold text-gray-700 dark:text-gray-200 shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] hover:scale-[1.05] active:scale-[0.97] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl font-semibold text-white bg-red-500 shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] hover:scale-[1.05] active:scale-[0.97] hover:bg-red-600 transition-all duration-200"
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
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300">
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
                      disabled={isAddingUser || availableRoles.length === 0}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="" disabled>
                        {availableRoles.length === 0
                          ? "No roles available"
                          : "Select Role *"}
                      </option>
                      {availableRoles.map((role) => (
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
                  disabled={isAddingUser || availableRoles.length === 0}
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
    </div>
  );
}

export default UserManagement;
