import { useState } from "react";
import { useSidebar } from "../Sidebar/SidebarContext";

// Define interface for Product data
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

  // Sample product data with proper typing
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
  ]);

  // State to manage modal visibility and selected product
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});

  // Handle row click to open modal
  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setEditedProduct({ ...product });
    setIsModalOpen(true);
    setEditMode(false);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setEditedProduct({});
    setEditMode(false);
  };

  // Handle input changes in edit mode
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

  // Save edited product
  const saveChanges = () => {
    if (selectedProduct) {
      const updatedProducts = products.map((p) =>
        p.id === selectedProduct.id
          ? ({ ...p, ...editedProduct } as Product)
          : p
      );
      setProducts(updatedProducts);
      setSelectedProduct({ ...selectedProduct, ...editedProduct } as Product);
      setEditMode(false);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    if (selectedProduct) {
      setEditedProduct({ ...selectedProduct });
      setEditMode(false);
    }
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
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(product)}
                  >
                    <td className="px-4 py-2">
                      <button className="font-bold text-sm cursor-pointer text-white bg-green-500 hover:bg-green-600 px-3 rounded-lg border border-green-600  outline-1 outline-green-700 focus:outline-green-800">
                        {product.id}
                      </button>
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

      {/* Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-black/30 to-black/70 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editMode ? "Edit Request" : selectedProduct.name}
              </h2>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-2.5 mb-8">
              {editMode ? (
                <>
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
                </>
              ) : (
                <>
                  <div>
                    <p>
                      <span className="font-medium">ID:</span>{" "}
                      {selectedProduct.id}
                    </p>
                    <p>
                      <span className="font-medium">Category:</span>{" "}
                      {selectedProduct.category}
                    </p>
                    <p>
                      <span className="font-medium">Price:</span>{" "}
                      {selectedProduct.price}
                    </p>
                  </div>
                  <div>
                    <p>
                      <span className="font-medium">Quantity:</span>{" "}
                      {selectedProduct.stock}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <span
                        className={
                          selectedProduct.status === "Transferred"
                            ? "text-green-600"
                            : selectedProduct.status === "In-Transit"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {selectedProduct.status}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Description:</span>{" "}
                      {selectedProduct.description}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              {editMode ? (
                <>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveChanges}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={closeModal}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Requested_Item;
