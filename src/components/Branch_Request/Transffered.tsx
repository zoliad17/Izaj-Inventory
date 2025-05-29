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

function Transferred() {
  const { isCollapsed } = useSidebar();

  // Sample product data with proper typing
  const [products, setProducts] = useState<Product[]>([
    {
      id: "001",
      name: "LED Bulb",
      category: "Bulbs",
      price: "Php 655.99",
      stock: 100,
      status: "Transferred",
      description: "Energy-efficient LED bulb with a lifespan of 25,000 hours.",
    },
    {
      id: "002",
      name: "LED Bulb",
      category: "Bulbs",
      price: "Php 655.99",
      stock: 100,
      status: "Transferred",
      description: "Energy-efficient LED bulb with a lifespan of 25,000 hours.",
    },
    {
      id: "003",
      name: "LED Bulb",
      category: "Bulbs",
      price: "Php 655.99",
      stock: 100,
      status: "Transferred",
      description: "Energy-efficient LED bulb with a lifespan of 25,000 hours.",
    },
  ]);

  // State to track selected products
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Remove selected products
  const removeSelectedProducts = () => {
    setProducts((prev) =>
      prev.filter((product) => !selectedProducts.includes(product.id))
    );
    setSelectedProducts([]);
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden mt-5">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h5 className="text-xl font-bold">Transferred Items</h5>
            {selectedProducts.length > 0 && (
              <button
                onClick={removeSelectedProducts}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Remove Selected ({selectedProducts.length})
              </button>
            )}
          </div>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Select
                  </th>
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
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
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
                        product.status === "Transferred"
                          ? "text-green-600"
                          : product.status === "In-Transit"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {product.status}
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
    </div>
  );
}

export default Transferred;
