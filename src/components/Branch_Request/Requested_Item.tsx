import { useState } from "react";
import { useSidebar } from "../Sidebar/SidebarContext";

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: "Transferred" | "In-Transit" | "Pending" | "Low Stock";
  description: string;
}

function Requested_Item() {
  const { isCollapsed } = useSidebar();

  const [products, setProducts] = useState<Product[]>([
    {
      id: "001",
      name: "LED Bulb",
      category: "Bulbs",
      price: "Php 655.99",
      stock: 100,
      status: "Pending",
      description: "Energy-efficient LED bulb with a lifespan of 25,000 hours.",
    },
    {
      id: "002",
      name: "Wireless Mouse",
      category: "Peripherals",
      price: "Php 899.99",
      stock: 50,
      status: "Pending",
      description: "Ergonomic wireless mouse with 2.4GHz connectivity.",
    },
  ]);

  // Separate states for edit modal and confirmation modal
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmModalContent, setConfirmModalContent] = useState<{
    title: string;
    message: string;
    action: () => void;
  }>({ title: "", message: "", action: () => {} });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditedProduct((prev) => ({
      ...prev,
      [name]: name === "stock" ? parseInt(value) || 0 : value,
    }));
  };

  const saveChanges = () => {
    if (selectedProduct) {
      const updatedProducts = products.map((p) =>
        p.id === selectedProduct.id
          ? ({ ...p, ...editedProduct } as Product)
          : p
      );
      setProducts(updatedProducts);
      setSelectedProduct({ ...selectedProduct, ...editedProduct } as Product);
      setIsEditModalOpen(false);
    }
  };

  const confirmAction = (
    title: string,
    message: string,
    action: () => void
  ) => {
    setConfirmModalContent({ title, message, action });
    setIsConfirmModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditedProduct({ ...product });
    setIsEditModalOpen(true);
  };

  const handleRemoveRequest = (productId: string) => {
    confirmAction(
      "Remove Request",
      "Are you sure you want to remove this request?",
      () => {
        setProducts(products.filter((p) => p.id !== productId));
        setIsConfirmModalOpen(false);
      }
    );
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProduct(null);
    setEditedProduct({});
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden mt-5">
        <div className="p-6">
          <h5 className="text-xl font-bold mb-4">Requested Items</h5>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    SKU/CODE
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Product Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Category
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Price
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Quantity
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {product.id}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {product.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {product.category}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {product.price}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {product.stock}
                    </td>
                    <td
                      className={`px-4 py-2 text-sm font-medium ${
                        product.status === "Pending"
                          ? "text-yellow-600"
                          : product.status === "Transferred"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {product.status}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveRequest(product.id)}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="p-4 bg-gray-100">
          <small className="text-gray-500">Last updated 3 mins ago</small>
        </div>
      </div>

      {/* Edit Modal - now uses isEditModalOpen */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-black/30 to-black/70 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Edit Request</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-2.5 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editedProduct.name || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={editedProduct.category || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="text"
                  name="price"
                  value={editedProduct.price || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  name="stock"
                  value={editedProduct.stock || 0}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editedProduct.description || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() =>
                  confirmAction(
                    "Discard Changes",
                    "Are you sure you want to discard your changes?",
                    closeEditModal
                  )
                }
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmAction(
                    "Save Changes",
                    "Are you sure you want to save these changes?",
                    saveChanges
                  )
                }
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - now uses isConfirmModalOpen */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-black/30 to-black/70 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {confirmModalContent.title}
            </h2>
            <p className="mb-6">{confirmModalContent.message}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeConfirmModal}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                No
              </button>
              <button
                onClick={() => {
                  confirmModalContent.action();
                  closeConfirmModal();
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Requested_Item;
