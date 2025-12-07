import { X, Package, Edit2, Trash2 } from "lucide-react";
import { useCategories } from "../../hooks/useOptimizedFetch";
import { useState, useEffect } from "react";
import * as React from "react";
import { api } from "../../utils/apiClient";
import { useRole, useAuth } from "../../contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";

interface Category {
  id: number;
  category_name: string;
}

interface CategoryListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryListModal = ({ isOpen, onClose }: CategoryListModalProps) => {
  const { data: categories, isLoading, error, refetch } = useCategories();
  const { isSuperAdmin } = useRole();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refetch categories when modal opens to ensure fresh data
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  // Filter and sort categories, ensuring we handle all edge cases
  // IMPORTANT: All hooks must be called before any conditional returns
  const filteredCategories = React.useMemo(() => {
    if (!categories || typeof categories !== "object") return [];

    // First, deduplicate by ID (in case there are duplicates)
    const uniqueCategoriesMap = new Map();
    const categoriesArray = Array.isArray(categories)
      ? categories
      : Object.values(categories);
    categoriesArray.forEach((cat: any) => {
      if (cat && cat.id && cat.category_name) {
        // Use the first occurrence of each ID
        if (!uniqueCategoriesMap.has(cat.id)) {
          uniqueCategoriesMap.set(cat.id, cat);
        }
      }
    });

    // Convert map to array, filter by search term, and sort
    const validCategories = Array.from(uniqueCategoriesMap.values())
      .filter((cat) =>
        cat.category_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      // Sort by ID for consistent display
      .sort((a, b) => a.id - b.id);

    return validCategories;
  }, [categories, searchTerm]);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.category_name);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editName.trim() || !currentUser?.user_id) return;

    setIsSubmitting(true);
    try {
      const { error } = await api.updateCategory(
        editingCategory.id,
        { category_name: editName.trim() },
        currentUser.user_id
      );

      if (error) {
        alert(`Failed to update category: ${error}`);
        return;
      }

      setEditingCategory(null);
      setEditName("");
      refetch(); // Refresh the categories list
    } catch (err) {
      console.error("Error updating category:", err);
      alert("Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory || !currentUser?.user_id) return;

    setIsSubmitting(true);
    try {
      const { error: deleteError } = await api.deleteCategory(
        deletingCategory.id,
        currentUser.user_id
      );

      if (deleteError) {
        // Check if this is the "products using category" error
        // The backend returns: "This category is being used by X product(s)..."
        if (
          deleteError.includes("being used by") ||
          deleteError.includes("product(s)")
        ) {
          toast.error(deleteError, {
            duration: 6000,
            style: {
              background: "#dc2626",
              color: "#fff",
              maxWidth: "500px",
            },
          });
        } else {
          toast.error(`Failed to delete category: ${deleteError}`, {
            duration: 4000,
          });
        }
        return;
      }

      toast.success(
        `Category "${deletingCategory.category_name}" deleted successfully!`,
        {
          duration: 3000,
        }
      );
      setDeletingCategory(null);
      refetch(); // Refresh the categories list
    } catch (err) {
      console.error("Error deleting category:", err);
      toast.error("Failed to delete category. Please try again.", {
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only Super Admin can access this modal
  if (!isOpen || !isSuperAdmin()) return null;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50">
        <div className="bg-white dark:bg-gray-900/90 rounded-lg shadow-lg p-6 w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Product Categories
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {Array.isArray(categories)
                  ? categories.length
                  : Object.keys(categories || {}).length}{" "}
                total categories
                {searchTerm && (
                  <span className="ml-2">
                    ({filteredCategories.length} matching)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white"
            />
          </div>

          {/* Categories List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 dark:text-red-400">
                  Failed to load categories
                </p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? "No categories found matching your search"
                    : "No categories available"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCategories.map((category, index) => (
                  <div
                    key={`category-${category.id}-${index}`}
                    className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-tr from-green-500/20 to-green-700/20 dark:from-green-800/30 dark:to-green-600/30">
                      <Package
                        className="text-green-600 dark:text-green-400"
                        size={20}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {category.category_name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {category.id}
                      </p>
                    </div>
                    {/* Only show edit/delete buttons for Super Admin */}
                    {isSuperAdmin() && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          title="Edit category"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(category)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Modal */}
          {editingCategory && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-[60]">
              <div className="bg-white dark:bg-gray-900/90 rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Edit Category
                  </h3>
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setEditName("");
                    }}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white"
                    placeholder="Enter category name"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setEditName("");
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || !editName.trim()}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deletingCategory && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-[60]">
              <div className="bg-white dark:bg-gray-900/90 rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Delete Category
                  </h3>
                  <button
                    onClick={() => setDeletingCategory(null)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Are you sure you want to delete the category{" "}
                  <span className="font-semibold">
                    "{deletingCategory.category_name}"
                  </span>
                  ? This action cannot be undone.
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
                  Note: Categories that are being used by products cannot be
                  deleted.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeletingCategory(null)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryListModal;
