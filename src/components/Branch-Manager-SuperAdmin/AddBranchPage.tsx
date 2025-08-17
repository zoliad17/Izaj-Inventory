import { useNavigate } from "react-router-dom";
// import { ArrowLeft } from "lucide-react";
import { useSidebar } from "../Sidebar/SidebarContext";
import { Toaster, toast } from "react-hot-toast";
import { useState } from "react";

function AddBranchPage() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const branchData = {
      location: formData.get("location") as string,
      address: formData.get("address") as string,
    };

    try {
      const response = await fetch("http://localhost:5000/api/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(branchData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add branch");
      }

      const result = await response.json();
      toast.success("Branch added successfully!");
      console.log("Branch added:", result);
      navigate("/dashboard"); // Redirect back to dashboard after adding
    } catch (error) {
      console.error("Error adding branch:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add branch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`transition-all duration-300 ${isCollapsed ? "ml-5" : "ml-1"
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
        {/* <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 mb-6 hover:text-purple-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button> */}

        <h1 className="text-2xl font-bold px-6 mt-6 text-gray-800">
          Add New Branch
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Branch Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Branch Information
            </h2>

            <div className="grid  grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
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
          {/* <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Contact Information
            </h2>

            <div>
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
          </div> */}

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
              disabled={isSubmitting}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBranchPage;
