import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSidebar } from "../Sidebar/SidebarContext";
import { Toaster } from "react-hot-toast";

function AddBranchPage() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Branch added");
    navigate("/dashboard"); // Redirect back to dashboard after adding
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="p-2 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
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
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 mb-6 hover:text-purple-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Add New Branch
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Branch Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Branch Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Northwest Regional Office"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Street, City, State, ZIP"
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="manager"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Branch Manager <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="manager"
                  name="manager"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="+1 (___) ___-____"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="contact@branch.example.com"
              />
            </div>
          </div>

          {/* Lighting-Specific Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Lighting Company Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="specialization"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Lighting Specialization
                </label>
                <select
                  id="specialization"
                  name="specialization"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="residential">Residential Lighting</option>
                  <option value="commercial">Commercial Lighting</option>
                  <option value="industrial">Industrial Lighting</option>
                  <option value="landscape">Landscape Lighting</option>
                  <option value="all">All Types</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="installationServices"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Installation Services
                </label>
                <select
                  id="installationServices"
                  name="installationServices"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="yes">Available</option>
                  <option value="no">Not Available</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="inventoryCapacity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Inventory Capacity (units)
              </label>
              <input
                type="number"
                id="inventoryCapacity"
                name="inventoryCapacity"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Estimated capacity for lighting products"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Add Branch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBranchPage;
