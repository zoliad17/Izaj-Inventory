import { useState } from "react";
import { useSidebar } from "../Sidebar/SidebarContext";

// Define interface for Product data
interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: "Pending" | "Approved" | "Rejected" | "In Stock" | "Low Stock";
  imageUrl: string;
  description: string;
}

function PendingRequest() {
  const { isCollapsed } = useSidebar();

  // State with typed products array
  const [products, setProducts] = useState<Product[]>([
    {
      id: "001",
      name: "LED Bulb",
      category: "Bulbs",
      price: "Php 345.99",
      stock: 100,
      status: "Pending",
      imageUrl: "light1.jpg",
      description: "Energy-efficient LED bulb with a lifespan of 25,000 hours.",
    },
    // Add more products as needed
  ]);

  // State to manage modal visibility and selected product
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionType, setActionType] = useState<"accept" | "decline" | null>(
    null
  );

  // Handle action button click
  const handleActionClick = (
    product: Product,
    action: "accept" | "decline"
  ) => {
    setSelectedProduct(product);
    setActionType(action);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setActionType(null);
  };

  // Confirm action
  const confirmAction = () => {
    if (selectedProduct && actionType) {
      const updatedProducts = products.map((p) => {
        if (p.id === selectedProduct.id) {
          return {
            ...p,
            status:
              actionType === "accept"
                ? "Approved"
                : ("Rejected" as Product["status"]),
          };
        }
        return p;
      });

      setProducts(updatedProducts);
      alert(`Request ${actionType === "accept" ? "Accepted" : "Declined"}!`);
    }
    closeModal();
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden mt-5">
        <div className="p-6">
          <h5 className="text-xl font-bold mb-4">Pending Request</h5>

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
                    <td className="px-4 py-2 text-sm text-red-600 font-medium">
                      {product.status}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleActionClick(product, "accept")}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleActionClick(product, "decline")}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          Decline
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

      {/* Confirmation Modal */}
      {isModalOpen && selectedProduct && actionType && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              Confirm {actionType === "accept" ? "Acceptance" : "Rejection"}
            </h2>
            <p className="mb-4">
              Are you sure you want to {actionType} the product{" "}
              <span className="font-semibold">{selectedProduct.name}</span> (ID:{" "}
              {selectedProduct.id})?
            </p>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`${
                  actionType === "accept"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                } text-white px-4 py-2 rounded`}
              >
                Confirm {actionType === "accept" ? "Accept" : "Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingRequest;
