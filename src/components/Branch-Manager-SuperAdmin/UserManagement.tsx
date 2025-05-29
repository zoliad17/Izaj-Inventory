import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSidebar } from "../Sidebar/SidebarContext";

// Define interface for User data
interface User {
  id: number;
  name: string;
  image: string;
  location: string;
  contact: string;
  description: string;
}

function UserManagement() {
  const { isCollapsed } = useSidebar();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  // State management with proper typing
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});

  // Mock user data with proper typing
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "Killua Zoldick",
      image: "/src/assets/image/user.png",
      location: "123 Main Street, Lucena City",
      contact: "(042) 123-4567",
      description: "A skilled assassin from the Zoldick family.",
    },
  ]);

  // Find the user by userId
  const user = users.find((u) => u.id === parseInt(userId || ""));

  if (!user) {
    return <div>User not found</div>;
  }

  // Handle input changes in edit mode
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({ ...prev, [name]: value }));
  };

  // Handle updating the user
  const handleUpdate = () => {
    const updatedUsers = users.map((u) =>
      u.id === user.id ? { ...u, ...editedUser } : u
    );
    setUsers(updatedUsers);
    setIsEditMode(false);
    toast.success("User updated successfully!");
  };

  // Handle deleting the user
  const handleDelete = () => {
    const updatedUsers = users.filter((u) => u.id !== user.id);
    setUsers(updatedUsers);
    setIsDeleteModalOpen(false);
    toast.success("User deleted successfully!");
    setTimeout(() => {
      navigate("/add-user");
    }, 1500);
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* User Image on the left */}
          <div className="flex-shrink-0">
            <img
              src={user.image}
              className="w-100 h-100 object-cover rounded-full border border-gray-200"
              alt={`${user.name}'s profile`}
            />
          </div>

          {/* User Details on the right */}
          <div className="flex-1 w-full">
            <div className="text-left">
              {isEditMode ? (
                // Edit Mode Form
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-gray-700 font-medium mb-1"
                      htmlFor="name"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      defaultValue={user.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-gray-700 font-medium mb-1"
                      htmlFor="location"
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      id="location"
                      defaultValue={user.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Location"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-gray-700 font-medium mb-1"
                      htmlFor="contact"
                    >
                      Contact
                    </label>
                    <input
                      type="text"
                      name="contact"
                      id="contact"
                      defaultValue={user.contact}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contact"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-gray-700 font-medium mb-1"
                      htmlFor="description"
                    >
                      Description
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      defaultValue={user.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Description"
                    />
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-2 mt-25">
                  <h2 className="text-xl font-semibold mb-2">{user.name}</h2>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>{" "}
                    <span className="text-gray-600">{user.location}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Contact:</span>{" "}
                    <span className="text-gray-600">{user.contact}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Description:
                    </span>
                    <span className="text-gray-700">{user.description}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex space-x-4 mt-6">
              {isEditMode ? (
                // Save and Cancel Buttons (Edit Mode)
                <>
                  <button
                    onClick={handleUpdate}
                    className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition duration-300"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition duration-300"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                // Edit and Remove Buttons (View Mode)
                <>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition duration-300"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-b from-black/30 to-black/70 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg">
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
                Remove
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
