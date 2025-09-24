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
          </div>


          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 outline-1 text-red-700 dark:outline-0 dark:text-red-500 neumorphic-button-transparent border-gray-300 dark:border-gray-600 rounded-md  hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 neumorphic-button-transparent outline-1 dark:outline-0 bg-green-600 text-green-700 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
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
