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
import { supabase } from "../../../backend/Server/Supabase/supabase";
// import { use } from "echarts/types/src/extension.js";
import toast, { Toaster } from "react-hot-toast";

// Define interface for User data
interface User {
  user_id: number;
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
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [branchFilter, setBranchFilter] = useState<string>("All");
  const [otp, setOtp] = useState<string>("");
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpVerified, setOtpVerified] = useState<boolean>(false);
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

      // Join user data with branch and role information
      const usersWithInfo = await Promise.all(
        data.map(async (user: User) => {
          // Get branch information
          const { data: branchData, error: branchError } = await supabase
            .from("branch")
            .select("location")
            .eq("id", user.branch_id)
            .single();

          // Get role information
          const { data: roleData, error: roleError } = await supabase
            .from("role")
            .select("role_name")
            .eq("id", user.role_id)
            .single();

          if (branchError) {
            console.error("Error fetching branch:", branchError);
          }
          if (roleError) {
            console.error("Error fetching role:", roleError);
          }

          return {
            ...user,
            branch_name: branchData?.location || "N/A",
            role_name: roleData?.role_name || "N/A",
          };
        })
      );

      setUsers(usersWithInfo);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  };

  // Fetch roles from Supabase
  useEffect(() => {
    async function fetchRoles() {
      const { data, error } = await supabase
        .from("role")
        .select("id, role_name");
      if (error) console.error("Failed to fetch roles:", error);
      else {
        setRoles(data || []);
        if (data && data.length > 0) {
          setNewUser((prev) => ({ ...prev, role_id: data[0].id }));
        }
      }
    }
    fetchRoles();
  }, []);

  useEffect(() => {
    async function fetchBranches() {
      const { data, error } = await supabase
        .from("branch")
        .select("id, location");
      if (error) console.error("Failed to fetch branches:", error);
      else {
        setBranches(data || []);
        if (data && data.length > 0) {
          setNewUser((prev) => ({ ...prev, branch_id: data[0].id }));
        }
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
    userId?: number
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
  const handleUpdate = async (userId: number) => {
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

  // Generate and send OTP (mock implementation)
  const sendOtp = () => {
    // In a real app, you would send this to the user's email
    const generated = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(generated);
    setOtpSent(true);
    toast(`OTP sent to ${newUser.email} (Mock OTP: ${generated})`);
  };

  // Verify OTP
  const verifyOtp = () => {
    if (otp === generatedOtp) {
      setOtpVerified(true);
      toast.success("OTP verified successfully!");
    } else {
      toast.error("Invalid OTP. Please try again.");
    }
  };

  // Add new user
  const handleAddUser = async () => {
    if (!otpVerified) {
      toast.error("Please verify OTP first");
      return;
    }

    // Validate required fields
    if (
      !newUser.name ||
      !newUser.email ||
      !newUser.contact ||
      !newUser.role_id ||
      !newUser.password
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

    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        contact: cleanContact,
        role_id: newUser.role_id,
        branch_id: newUser.branch_id,
        status: newUser.status || "Active",
      };

      console.log("Creating user with data:", userData);

      const response = await fetch("http://localhost:5000/api/create_users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Server error response:", data);
        throw new Error(data.error || data.message || "Failed to create user");
      }

      // Refresh the user list
      await fetchUsers();

      setIsAddModalOpen(false);
      setOtpSent(false);
      setOtpVerified(false);
      setOtp("");
      setNewUser({
        name: "",
        contact: "",
        email: "",
        status: "Active",
        role_id: roles[0]?.id || 1,
        branch_id: branches[0]?.id || "",
      });
      toast.success("User added successfully!");
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create user";
      toast.error(errorMessage);
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

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
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
            className="flex items-center cursor-pointer gap-2 text-gray-800 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h5 className="text-2xl font-bold">User Management</h5>
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
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full sm:w-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <button className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300">
              <Download size={16} />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <tr key={user.user_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <input
                            type="text"
                            name="name"
                            defaultValue={user.name}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          user.name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <input
                            type="text"
                            name="contact"
                            defaultValue={user.contact}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          user.contact
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <input
                            type="email"
                            name="email"
                            defaultValue={user.email}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <select
                            name="role_id"
                            defaultValue={user.role_id}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditMode && editedUser.user_id === user.user_id ? (
                          <select
                            name="branch_id"
                            defaultValue={user.branch_id}
                            onChange={(e) => handleInputChange(e, user.user_id)}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
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
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
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
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setIsEditMode(false);
                                setEditedUser({});
                              }}
                              className="text-gray-600 hover:text-gray-900"
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
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setUserIdToDelete(user.user_id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900"
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
                      className="px-6 py-4 text-center text-sm text-gray-500"
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
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
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
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
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
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
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
          <div className="relative bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Column 1 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Name *"
                    value={newUser.name}
                    onChange={(e) => handleInputChange(e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    value={newUser.email}
                    onChange={(e) => handleInputChange(e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password *"
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newUser.contact}
                    onChange={handleContactChange}
                    placeholder="Enter 11-digit contact number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter 11 digits (e.g., 09123456789)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch
                  </label>
                  <select
                    name="branch_id"
                    value={newUser.branch_id}
                    onChange={(e) => handleInputChange(e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    name="role_id"
                    value={newUser.role_id}
                    onChange={(e) => handleInputChange(e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newUser.status}
                    onChange={(e) => handleInputChange(e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* OTP Verification Section - Full width below columns */}
            <div className="mt-4">
              {!otpVerified && (
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={sendOtp}
                      disabled={!newUser.email || otpSent}
                      className={`px-3 py-2 rounded-md text-sm ${
                        !newUser.email || otpSent
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {otpSent ? "OTP Sent" : "Send OTP"}
                    </button>
                    {otpSent && (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <button
                          onClick={verifyOtp}
                          className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                        >
                          Verify
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {otpVerified && (
                <div className="p-2 bg-green-100 text-green-800 rounded-md text-sm mt-2">
                  OTP verified successfully!
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setOtpSent(false);
                  setOtpVerified(false);
                  setOtp("");
                }}
                className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={!otpVerified}
                className={`py-2 px-4 rounded-lg transition duration-300 ${
                  otpVerified
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
