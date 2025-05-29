import { useState } from "react";
import { useSidebar } from "../Sidebar/SidebarContext";

// Define interface for Product data
interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: "In Stock" | "Out of Stock" | "Low Stock";
  imageUrl?: string;
  detailsPage?: string;
}

function ProductTable() {
  const { isCollapsed } = useSidebar();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State with typed products array
  const [products] = useState<Product[]>([
    {
      id: "001",
      name: "LED Bulb",
      category: "Bulbs",
      price: "Php 345.99",
      stock: 100,
      status: "In Stock",
      imageUrl: "light1.jpg",
      detailsPage: "/product/001",
    },
    // Add more products as needed
    {
      id: "002",
      name: "Smart Switch",
      category: "Switches",
      price: "Php 599.99",
      stock: 5,
      status: "Low Stock",
      imageUrl: "switch1.jpg",
      detailsPage: "/product/002",
    },
    {
      id: "003",
      name: "Circuit Breaker",
      category: "Safety",
      price: "Php 899.99",
      stock: 0,
      status: "Out of Stock",
      imageUrl: "breaker1.jpg",
      detailsPage: "/product/003",
    },
  ]);

  const handleViewClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden mt-5">
        <div className="p-6">
          <h5 className="text-xl font-bold mb-4">Available in Lucena</h5>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Product ID
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
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: Product) => (
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
                        product.status === "In Stock"
                          ? "text-green-600"
                          : product.status === "Low Stock"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {product.status}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      <button
                        onClick={() => handleViewClick(product)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        View
                      </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{selectedProduct.name}</h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Product ID</p>
                <p>{selectedProduct.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p>{selectedProduct.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p>{selectedProduct.price}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stock Quantity</p>
                <p>{selectedProduct.stock}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p
                  className={`font-medium ${
                    selectedProduct.status === "In Stock"
                      ? "text-green-600"
                      : selectedProduct.status === "Low Stock"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {selectedProduct.status}
                </p>
              </div>
              {selectedProduct.imageUrl && (
                <div>
                  <p className="text-sm text-gray-500">Image</p>
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-32 h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductTable;
