import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  // State with typed products array (removed unused setProducts)
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
  ]);

  // Handle product click with proper typing
  const handleProductClick = (productId: string) => {
    navigate(`/request_product/${productId}`);
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
                </tr>
              </thead>
              <tbody>
                {products.map(
                  (
                    product: Product // Explicitly typed product parameter
                  ) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td
                        className="px-4 py-2 text-sm font-bold text-gray-700 cursor-pointer"
                        onClick={() => handleProductClick(product.id)}
                      >
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
                    </tr>
                  )
                )}
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

export default ProductTable;
