import { useNavigate } from "react-router-dom";
// import { ArrowLeft } from "lucide-react";
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
      } p-2 sm:p-4 bg-gray-50 dark:bg-gray-900`}
    >
      <div className="p-2 max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold px-6 mt-6 text-gray-800 dark:text-white">
          Add New Lighting Category
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-gray-700">
              Category Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., LED Bulbs, Chandeliers"
                />
              </div>

              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Category Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., LED-001"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Detailed description of this lighting category"
              />
            </div>
          </div>

          {/* Technical Specifications Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-gray-700">
              Technical Specifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="voltage"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Voltage Range
                </label>
                <input
                  type="text"
                  id="voltage"
                  name="voltage"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 110-240V"
                />
              </div>

              <div>
                <label
                  htmlFor="wattage"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Wattage Range
                </label>
                <input
                  type="text"
                  id="wattage"
                  name="wattage"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 5W-100W"
                />
              </div>

              <div>
                <label
                  htmlFor="colorTemp"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Color Temperature
                </label>
                <input
                  type="text"
                  id="colorTemp"
                  name="colorTemp"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 2700K-6500K"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="lifespan"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Average Lifespan (hours)
                </label>
                <input
                  type="number"
                  id="lifespan"
                  name="lifespan"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 25000"
                />
              </div>

              <div>
                <label
                  htmlFor="warranty"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Warranty Period
                </label>
                <select
                  id="warranty"
                  name="warranty"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-gray-700">
              Application & Compatibility
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="application"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Primary Application
                </label>
                <select
                  id="application"
                  name="application"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Fixture Type
                </label>
                <select
                  id="fixtureType"
                  name="fixtureType"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Compatibility Notes
              </label>
              <textarea
                id="compatibility"
                name="compatibility"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Any special compatibility requirements"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-gray-700">
              Visual Representation
            </h2>

            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Category Image
              </label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900 dark:file:text-green-200"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload a representative image for this category (JPEG, PNG)
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
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
