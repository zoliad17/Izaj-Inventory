import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: {
    id: number;
    name: string;
    category: number;
    price: string;
    stock: string;
    status: "In Stock" | "Out of Stock" | "Low Stock";
  }) => void;
  product: {
    id: number;
    name: string;
    category: number;
    price: string;
    stock: number;
    status: "In Stock" | "Out of Stock" | "Low Stock";
  };
  categories: { id: number; category_name: string }[];
  statusOptions: ("In Stock" | "Out of Stock" | "Low Stock")[];
}

const EditProductModal = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
  statusOptions,
}: EditProductModalProps) => {
  const [editedProduct, setEditedProduct] = useState({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock.toString(),
    status: product.status,
  });

  useEffect(() => {
    setEditedProduct({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock.toString(),
      status: product.status,
    });
  }, [product]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditedProduct((prev) => ({
      ...prev,
      [name]: name === "category" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedProduct);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50">
      <div className="bg-white dark:bg-gray-900/90 rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit Product
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={editedProduct.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                name="category"
                value={editedProduct.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white"
                required
              >
                <option value={0}>Select a category</option>
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
                value={editedProduct.price}
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
                value={editedProduct.stock}
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
                value={editedProduct.status}
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
              className="px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors neumorphic-button-transparent dark:outline-0 outline-1 text-red-600 dark:text-red-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600  rounded-md hover:bg-blue-700 transition-colors neumorphic-button-transparent text-blue-600 dark:text-blue-500 outline-1 dark:outline-0"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
