import {
  LocationMarkerIcon,
  PhoneIcon,
  PlusIcon,
} from "@heroicons/react/outline";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../Sidebar/SidebarContext";

// Define interface for User data
interface User {
  id: number;
  name: string;
  location: string;
  contact: string;
  image: string;
  description?: string; // Optional property
}

// Define interface for New User data (without id)
interface NewUser {
  name: string;
  location: string;
  contact: string;
  image: string;
}

function AddUser() {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();

  // State to manage modal visibility
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // State to manage new user data
  const [newUser, setNewUser] = useState<NewUser>({
    name: "",
    location: "",
    contact: "",
    image: "",
  });

  // State to manage users list
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "Killua Zoldick",
      image: "/src/assets/image/user.png",
      location: "123 Main Street, Lucena City",
      contact: "(042) 123-4567",
    },
  ]);

  // Function to open the modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Function to handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add the new user to the users array
    const userToAdd: User = {
      id: users.length + 1, // Generate a new ID
      ...newUser,
    };
    setUsers((prev) => [...prev, userToAdd]);
    closeModal();
    // Reset the form
    setNewUser({
      name: "",
      location: "",
      contact: "",
      image: "",
    });
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      {/* Add User Button */}
      <div className="flex justify-end mt-5">
        <button
          className="flex items-center bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
          onClick={openModal}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add User
        </button>
      </div>

      {/* User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
        {users.map((user) => (
          <div key={user.id} className="col flex flex-col">
            <div className="card h-full bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              {/* User Image */}
              <img
                src={user.image}
                className="w-full h-48 object-cover"
                alt={`${user.name}'s profile`}
              />

              {/* User Details */}
              <div className="p-6 flex-grow">
                <h5 className="text-xl font-bold mb-2">{user.name}</h5>
                <div className="flex items-center text-gray-600 mb-2">
                  <LocationMarkerIcon className="h-5 w-5 mr-2" />
                  <span>{user.location}</span>
                </div>
                <div className="flex items-center text-gray-600 mb-2">
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  <span>{user.contact}</span>
                </div>
                {user.description && (
                  <p className="text-gray-700">{user.description}</p>
                )}
              </div>

              {/* View Button */}
              <div className="p-4 bg-gray-100 w-full">
                <button
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
                  onClick={() => navigate(`/user-management/${user.id}`)}
                >
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Adding a New User */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-b from-black/30 to-black/70 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-11/12 md:w-1/2 lg:w-1/3">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>
            <form onSubmit={handleSubmit}>
              {/* Name Input */}
              <div className="mb-4">
                <label className="block text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Location Input */}
              <div className="mb-4">
                <label className="block text-gray-700">Location</label>
                <input
                  type="text"
                  name="location"
                  value={newUser.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Contact Input */}
              <div className="mb-4">
                <label className="block text-gray-700">Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={newUser.contact}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Image URL Input */}
              <div className="mb-4">
                <label className="block text-gray-700">Image URL</label>
                <input
                  type="text"
                  name="image"
                  value={newUser.image}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddUser;
