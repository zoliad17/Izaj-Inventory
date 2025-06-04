import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSidebar } from "../Sidebar/SidebarContext";

function AddCategoryPage() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Category added");
    navigate("/dashboard"); // Redirect back to dashboard after adding
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="p-2 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 mb-6 hover:text-green-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Add New Lighting Category
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Category Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., LED Bulbs, Chandeliers"
                />
              </div>

              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., LED-001"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Detailed description of this lighting category"
              />
            </div>
          </div>

          {/* Technical Specifications Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Technical Specifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="voltage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Voltage Range
                </label>
                <input
                  type="text"
                  id="voltage"
                  name="voltage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 110-240V"
                />
              </div>

              <div>
                <label
                  htmlFor="wattage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Wattage Range
                </label>
                <input
                  type="text"
                  id="wattage"
                  name="wattage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 5W-100W"
                />
              </div>

              <div>
                <label
                  htmlFor="colorTemp"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Color Temperature
                </label>
                <input
                  type="text"
                  id="colorTemp"
                  name="colorTemp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 2700K-6500K"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="lifespan"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Average Lifespan (hours)
                </label>
                <input
                  type="number"
                  id="lifespan"
                  name="lifespan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 25000"
                />
              </div>

              <div>
                <label
                  htmlFor="warranty"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Warranty Period
                </label>
                <select
                  id="warranty"
                  name="warranty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Warranty</option>
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                  <option value="3">3 Years</option>
                  <option value="5">5 Years</option>
                  <option value="10">10 Years</option>
                </select>
              </div>
            </div>
          </div>

          {/* Application & Compatibility */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Application & Compatibility
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="application"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Primary Application
                </label>
                <select
                  id="application"
                  name="application"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Application</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="specialty">Specialty</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="fixtureType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fixture Type
                </label>
                <select
                  id="fixtureType"
                  name="fixtureType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Fixture Type</option>
                  <option value="bulb">Bulb</option>
                  <option value="tube">Tube</option>
                  <option value="panel">Panel</option>
                  <option value="strip">Strip</option>
                  <option value="recessed">Recessed</option>
                  <option value="pendant">Pendant</option>
                  <option value="chandelier">Chandelier</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="compatibility"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Compatibility Notes
              </label>
              <textarea
                id="compatibility"
                name="compatibility"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Any special compatibility requirements"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Visual Representation
            </h2>

            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category Image
              </label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload a representative image for this category (JPEG, PNG)
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Add Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCategoryPage;
