import { X } from "lucide-react";
import { useState } from "react";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (
    product: {
      name: string;
      category: number; // category id as number
      price: string;
      stock: string;
      status: "In Stock" | "Out of Stock" | "Low Stock";
    },
    branchId?: number
  ) => void;
  categories: { id: number; category_name: string }[];
  statusOptions: ("In Stock" | "Out of Stock" | "Low Stock")[];
}

const AddProductModal = ({
  isOpen,
  onClose,
  onAddProduct,
  categories,
  statusOptions,
}: AddProductModalProps) => {
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: 0, // default to 0 (no selection)
    price: "",
    stock: "",
    status: "In Stock" as const,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: name === "category" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return; // Prevent double submission
    }

    // Debug logging
    console.log("Form submitted with data:", newProduct);

    // Validate required fields
    if (!newProduct.name.trim()) {
      alert("Product name is required");
      return;
    }

    if (newProduct.category === 0) {
      alert("Please select a category");
      return;
    }

    if (!newProduct.price || Number(newProduct.price) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    if (!newProduct.stock || Number(newProduct.stock) < 0) {
      alert("Please enter a valid stock quantity");
      return;
    }

    setIsSubmitting(true);

    try {
      // Pass branch_id as a second argument if available
      let branchId = localStorage.getItem("branchId");
      console.log("Branch ID from localStorage:", branchId);

      if (branchId) {
        branchId = String(Number(branchId)); // Always save as number string
        localStorage.setItem("branchId", branchId); // Overwrite with number string
        console.log(
          "Calling onAddProduct with:",
          { ...newProduct },
          "and branchId:",
          Number(branchId)
        );
        await onAddProduct({ ...newProduct }, Number(branchId));
      } else {
        console.log("Calling onAddProduct with:", newProduct);
        await onAddProduct(newProduct);
      }

      onClose();
      // Reset form
      setNewProduct({
        name: "",
        category: 0,
        price: "",
        stock: "",
        status: "In Stock",
      });
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50">
      <div className="bg-white dark:bg-gray-900/90 rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add New Product
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white"
                required
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                name="category"
                value={newProduct.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white"
                required
                disabled={categories.length === 0}
              >
                <option value={0}>
                  {categories.length === 0
                    ? "Loading categories..."
                    : "Select a category"}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={newProduct.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                name="stock"
                value={newProduct.stock}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                name="status"
                value={newProduct.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white"
                required
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2  rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700 transition-color dark:outline-0 outline-1 neumorphic-button-transparent text-red-600 dark:text-red-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed neumorphic-button-transparent text-blue-600 dark:text-blue-500 outline-1 dark:outline-0"
            >
              {isSubmitting ? "Adding..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
