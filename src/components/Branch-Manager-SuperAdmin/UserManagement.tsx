import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
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

// Define interface for User data
interface User {
  id: number;
  name: string;
  contact: string;
  email: string;
  description: string;
  status: "Active" | "Inactive";
  branch: "Lucena" | "Batangas" | "Laguna";
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

  // New user form state
  const [newUser, setNewUser] = useState<Omit<User, "id">>({
    name: "",
    contact: "",
    email: "",
    description: "",
    status: "Active",
    branch: "Lucena",
  });

  // Mock user data
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "Killua Zoldick",
      contact: "(042) 123-4567",
      email: "killua@hunter.com",
      description: "A skilled assassin from the Zoldick family.",
      status: "Active",
      branch: "Lucena",
    },
    {
      id: 2,
      name: "Gon Freecss",
      contact: "(042) 234-5678",
      email: "gon@hunter.com",
      description: "A determined hunter searching for his father.",
      status: "Active",
      branch: "Batangas",
    },
    {
      id: 3,
      name: "Kurapika",
      contact: "(042) 345-6789",
      email: "kurapika@hunter.com",
      description: "The last survivor of the Kurta clan.",
      status: "Inactive",
      branch: "Laguna",
    },
    {
      id: 4,
      name: "Leorio Paradinight",
      contact: "(042) 456-7890",
      email: "leorio@hunter.com",
      description: "A medical student and aspiring hunter.",
      status: "Active",
      branch: "Lucena",
    },
    {
      id: 5,
      name: "Hisoka Morrow",
      contact: "(042) 567-8901",
      email: "hisoka@hunter.com",
      description: "A powerful and unpredictable magician.",
      status: "Inactive",
      branch: "Batangas",
    },
    {
      id: 6,
      name: "Illumi Zoldick",
      contact: "(042) 678-9012",
      email: "illumi@hunter.com",
      description: "Killua's older brother and professional assassin.",
      status: "Active",
      branch: "Laguna",
    },
    {
      id: 7,
      name: "Biscuit Krueger",
      contact: "(042) 789-0123",
      email: "biscuit@hunter.com",
      description: "A double-star hunter and master trainer.",
      status: "Active",
      branch: "Lucena",
    },
    {
      id: 8,
      name: "Chrollo Lucilfer",
      contact: "(042) 890-1234",
      email: "chrollo@hunter.com",
      description: "Leader of the Phantom Troupe.",
      status: "Inactive",
      branch: "Batangas",
    },
  ]);

  // Filter users based on search term and branch
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = Object.values(user).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesBranch =
        branchFilter === "All" || user.branch === branchFilter;

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
          user.id === userId ? { ...user, [name]: value } : user
        )
      );
    } else {
      // Adding new user
      setNewUser((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle updating the user
  const handleUpdate = (userId: number) => {
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, ...editedUser } : u
    );
    setUsers(updatedUsers);
    setIsEditMode(false);
    toast.success("User updated successfully!");
  };

  // Handle deleting the user
  const handleDelete = () => {
    if (userIdToDelete) {
      const updatedUsers = users.filter((u) => u.id !== userIdToDelete);
      setUsers(updatedUsers);
      setIsDeleteModalOpen(false);
      toast.success("User deleted successfully!");
    }
  };

  // Generate and send OTP (mock implementation)
  const sendOtp = () => {
    // In a real app, you would send this to the user's email
    const generated = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(generated);
    setOtpSent(true);
    toast.info(`OTP sent to ${newUser.email} (Mock OTP: ${generated})`);
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
  const handleAddUser = () => {
    if (!otpVerified) {
      toast.error("Please verify OTP first");
      return;
    }

    const newId = Math.max(...users.map((u) => u.id)) + 1;
    const userToAdd: User = {
      id: newId,
      ...newUser,
    };

    setUsers([...users, userToAdd]);
    setIsAddModalOpen(false);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    setNewUser({
      name: "",
      contact: "",
      email: "",
      description: "",
      status: "Active",
      branch: "Lucena",
    });
    toast.success("User added successfully!");
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="p-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center cursor-pointer gap-2 text-gray-800 mb-6 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-2xl font-bold mb-4">User Management</h1>

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
              <option value="Lucena">Lucena</option>
              <option value="Batangas">Batangas</option>
              <option value="Laguna">Laguna</option>
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
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
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
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {isEditMode && editedUser.id === user.id ? (
                            <input
                              type="text"
                              name="name"
                              defaultValue={user.name}
                              onChange={(e) => handleInputChange(e, user.id)}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            user.name
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {isEditMode && editedUser.id === user.id ? (
                            <input
                              type="email"
                              name="email"
                              defaultValue={user.email}
                              onChange={(e) => handleInputChange(e, user.id)}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            user.email
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {isEditMode && editedUser.id === user.id ? (
                            <input
                              type="text"
                              name="contact"
                              defaultValue={user.contact}
                              onChange={(e) => handleInputChange(e, user.id)}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            />
                          ) : (
                            user.contact
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {isEditMode && editedUser.id === user.id ? (
                            <select
                              name="branch"
                              defaultValue={user.branch}
                              onChange={(e) => handleInputChange(e, user.id)}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="Lucena">Lucena</option>
                              <option value="Batangas">Batangas</option>
                              <option value="Laguna">Laguna</option>
                            </select>
                          ) : (
                            user.branch
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {isEditMode && editedUser.id === user.id ? (
                            <select
                              name="status"
                              defaultValue={user.status}
                              onChange={(e) => handleInputChange(e, user.id)}
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
                              {user.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isEditMode && editedUser.id === user.id ? (
                          <>
                            <button
                              onClick={() => handleUpdate(user.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setIsEditMode(false)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setIsEditMode(true);
                                setEditedUser({ id: user.id });
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setIsDeleteModalOpen(true);
                                setUserIdToDelete(user.id);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2Icon size={16} />
                            </button>
                          </>
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
        <div className="fixed inset-0  bg-black/50 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-4">Are you sure you want to delete this user?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0  bg-black/50 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={newUser.name}
                  onChange={(e) => handleInputChange(e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={(e) => handleInputChange(e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact
                </label>
                <input
                  type="text"
                  name="contact"
                  value={newUser.contact}
                  onChange={(e) => handleInputChange(e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <select
                  name="branch"
                  value={newUser.branch}
                  onChange={(e) => handleInputChange(e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Lucena">Lucena</option>
                  <option value="Batangas">Batangas</option>
                  <option value="Laguna">Laguna</option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newUser.description}
                  onChange={(e) => handleInputChange(e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>

              {/* OTP Verification Section */}
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
                <div className="p-2 bg-green-100 text-green-800 rounded-md text-sm">
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

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default UserManagement;
