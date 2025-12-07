import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { ArrowLeft } from "lucide-react";
import { useSidebar } from "../Sidebar/SidebarContext";
import { api } from "../../utils/apiClient";
import toast, { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";

function AddCategoryPage() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return; // Prevent multiple submissions

    const formData = new FormData(e.currentTarget);
    const categoryName = formData.get("name") as string;

    if (!categoryName || !categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await api.createCategory({
        category_name: categoryName.trim(),
      });

      if (error) {
        throw new Error(error);
      }

      toast.success("Category added successfully!");
      navigate("/dashboard"); // Redirect back to dashboard after adding
    } catch (error: any) {
      console.error("Error adding category:", error);
      const errorMessage = error?.message || error || "Failed to add category";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 bg-gray-50 dark:bg-gray-900`}
    >
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
      <div className="p-2 max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold px-6 mt-6 text-gray-800 dark:text-white">
          Add New Lighting Category
        </h1>

        <form
          onSubmit={handleSubmit}
          action="#"
          method="post"
          className="space-y-6 p-6"
        >
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
              disabled={isLoading}
              className={`px-6 py-2 neumorphic-button-transparent outline-1 dark:outline-0 bg-green-600 text-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                isLoading
                  ? "opacity-75 cursor-not-allowed"
                  : "hover:bg-green-700"
              } flex items-center gap-2`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Category"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCategoryPage;
