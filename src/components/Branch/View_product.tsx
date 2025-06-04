import { useState } from "react";
import { useNavigate } from "react-router-dom";
import light1 from "/src/assets/image/light1.jpg";
import { useSidebar } from "../Sidebar/SidebarContext";

// Define interface for Product data
interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: "In Stock" | "Out of Stock" | "Low Stock";
  imageUrl: string;
  description: string;
}

function View_product() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  // Static product data with proper typing
  const initialProduct: Product = {
    id: "001",
    name: "LED Bulb",
    category: "Bulbs",
    price: "Php 599.99",
    stock: 100,
    status: "In Stock",
    imageUrl: light1,
    description:
      "This is a detailed description of the LED Bulb This is a detailed description of the LED Bulb This is a detailed description of the LED Bulb This is a detailed description of the LED Bulb .",
  };

  // State to manage form data
  const [product] = useState<Product>(initialProduct);

  // Handle "Back to All Stock" button click
  const handleBackToAllStock = () => {
    navigate("/branch_products");
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="ml-5 mr-5 p-6 max-w-4.5xl mx-auto bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Available Product</h1>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Product Image */}
          <div className="w-full md:w-80 h-auto">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-auto rounded-lg"
            />
          </div>

          <div className="flex-2">
            <h3 className="text-3xl font-extrabold mb-2">{product.name}</h3>
            <h5 className="text-lg font-bold mb-2">{product.category}</h5>
            <h5 className="text-lg font-bold mb-2 text-green-500">
              {product.status}
            </h5>
            <h5 className="text-lg font-bold mb-2 text-green-500">
              {product.price}
            </h5>
            <p className="text-sm font-semibold mb-2">{product.description}</p>

            {/* Buttons */}
            <div className="mt-6 flex gap-4 float-end">
              <button
                type="button"
                onClick={handleBackToAllStock}
                className="px-4 mt-30 mr-10 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default View_product;
