import {
  LocationMarkerIcon,
  PhoneIcon,
  MailIcon,
  UserIcon,
  PlusIcon,
} from "@heroicons/react/outline";
import {
  UserPlus,
  User,
  AtSign,
  Mail,
  Phone,
  // Image,
  Key,
  Home,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../Sidebar/SidebarContext";
import { Toaster } from "react-hot-toast";

// Define interface for User data
interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  location: string;
  contact: string;
  image: string;
  isVerified: boolean;
  role: "BranchManager";
  branch: "Lucena" | "San Pablo"; // Added branch field
  description?: string; // Optional property
}

// Define interface for New User data (without id)
interface NewUser {
  name: string;
  username: string;
  email: string;
  location: string;
  contact: string;
  image: string;
  role: "BranchManager";
  branch: "Lucena" | "San Pablo"; // Added branch field
}

function AddUser() {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();

  // State to manage modal visibility
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isOTPModalOpen, setIsOTPModalOpen] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("");
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const [tempUser, setTempUser] = useState<NewUser | null>(null);

  // State to manage new user data
  const [newUser, setNewUser] = useState<NewUser>({
    name: "",
    username: "",
    email: "",
    location: "",
    contact: "",
    image: "",
    role: "BranchManager", // Default role
    branch: "Lucena", // Default branch
  });

  // State to manage users list
  const [users, setUsers] = useState<User[]>([]);

  // Function to generate random OTP
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Function to open the modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Function to handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate OTP and save temporary user data
    const otp = generateOTP();
    setGeneratedOtp(otp);
    setTempUser(newUser);

    // In a real app, you would send this OTP to the user's email
    console.log(`OTP for ${newUser.email}: ${otp}`);

    // Show OTP verification modal
    setIsOTPModalOpen(true);
    closeModal();
  };

  // Function to verify OTP
  const verifyOTP = (e: React.FormEvent) => {
    e.preventDefault();

    if (otp === generatedOtp && tempUser) {
      // Add the new user to the users array
      const userToAdd: User = {
        id: users.length + 1, // Generate a new ID
        ...tempUser,
        isVerified: true,
      };

      setUsers((prev) => [...prev, userToAdd]);
      setIsOTPModalOpen(false);

      // Reset the form
      setNewUser({
        name: "",
        username: "",
        email: "",
        location: "",
        contact: "",
        image: "",
        role: "BranchManager",
        branch: "Lucena",
      });
      setOtp("");
      setTempUser(null);
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      {/* Top Section with Title and Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        {/* Toaster for success and error */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>

        {/* Register Button */}
        <button
          className="flex items-center cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 w-full md:w-auto justify-center"
          onClick={openModal}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Register New User
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
                  <UserIcon className="h-5 w-5 mr-2" />
                  <span>@{user.username}</span>
                </div>
                <div className="flex items-center text-gray-600 mb-2">
                  <MailIcon className="h-5 w-5 mr-2" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center text-gray-600 mb-2">
                  <LocationMarkerIcon className="h-5 w-5 mr-2" />
                  <span>{user.location}</span>
                </div>
                <div className="flex items-center text-gray-600 mb-2">
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  <span>{user.contact}</span>
                </div>
                <div className="flex items-center text-gray-600 mb-2">
                  <Key className="h-5 w-5 mr-2" />
                  <span>{user.role}</span>
                </div>
                <div className="flex items-center text-gray-600 mb-2">
                  <Home className="h-5 w-5 mr-2" />
                  <span>{user.branch}</span>
                </div>
                {user.description && (
                  <p className="text-gray-700">{user.description}</p>
                )}
                <div className="mt-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      user.isVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {user.isVerified ? "Verified" : "Pending Verification"}
                  </span>
                </div>
              </div>

              {/* View Button */}
              <div className="p-4 bg-gray-100 w-full">
                <button
                  className="w-full cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Register New User
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-2.5 mb-8">
                {/* Name Input */}
                <div className="space-y-2">
                  <label className=" text-sm font-medium text-gray-700 flex items-center">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={newUser.name}
                      onChange={handleInputChange}
                      className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Username Input */}
                <div className="space-y-2">
                  <label className=" text-sm font-medium text-gray-700 flex items-center">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      value={newUser.username}
                      onChange={handleInputChange}
                      className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <AtSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700  items-center">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={newUser.email}
                      onChange={handleInputChange}
                      className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className=" text-sm font-medium text-gray-700 flex items-center">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      name="role"
                      value={newUser.role}
                      onChange={handleInputChange}
                      className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="BranchManager">Branch Manager</option>
                    </select>
                    <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Branch Selection - Only shown for Branch Managers */}
                {newUser.role === "BranchManager" && (
                  <div className="space-y-2">
                    <label className=" text-sm font-medium text-gray-700 flex items-center">
                      Branch
                    </label>
                    <div className="relative">
                      <select
                        name="branch"
                        value={newUser.branch}
                        onChange={handleInputChange}
                        className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required={newUser.role === "BranchManager"}
                      >
                        <option value="Lucena">Lucena</option>
                        <option value="San Pablo">San Pablo</option>
                      </select>
                      <Home className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                )}

                {/* Contact Input */}
                <div className="space-y-2">
                  <label className=" text-sm font-medium text-gray-700 flex items-center">
                    Contact
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="contact"
                      value={newUser.contact}
                      onChange={handleInputChange}
                      className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 cursor-pointer text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {isOTPModalOpen && (
        <div className="fixed inset-0 bg-gradient-to-b from-black/30 to-black/70 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-11/12 md:w-1/2 lg:w-1/3">
            <h2 className="text-xl font-bold mb-4">Verify Your Email</h2>
            <p className="mb-4">
              We've sent a 6-digit OTP to {tempUser?.email}. Please enter it
              below to verify your account.
            </p>

            <form onSubmit={verifyOTP}>
              <div className="mb-4">
                <label className="block text-gray-700">OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  title="Please enter a 6-digit code"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsOTPModalOpen(false);
                    openModal();
                  }}
                  className="bg-gray-500 cursor-pointer text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 cursor-pointer text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
                >
                  Verify
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
