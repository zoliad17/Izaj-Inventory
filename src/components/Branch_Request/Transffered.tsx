import { useState, useMemo } from "react";
import { useSidebar } from "../Sidebar/SidebarContext";
import { FileSearch } from "lucide-react";
import { Toaster } from "react-hot-toast";

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
      name: "Incandescent Bulb",
      category: "Bulbs",
      price: "Php 120.50",
      stock: 50,
      status: "Transferred",
      description: "Traditional incandescent light bulb.",
    },
    {
      id: "003",
      name: "Fluorescent Tube",
      category: "Tubes",
      price: "Php 320.75",
      stock: 75,
      status: "Transferred",
      description: "Long fluorescent tube for office lighting.",
    },
    {
      id: "004",
      name: "Smart Bulb",
      category: "Smart Lights",
      price: "Php 899.99",
      stock: 30,
      status: "Transferred",
      description: "WiFi enabled smart bulb with color changing features.",
    },
    {
      id: "005",
      name: "LED Strip",
      category: "Decorative",
      price: "Php 450.25",
      stock: 45,
      status: "Transferred",
      description: "Flexible LED strip for decorative lighting.",
    },
    {
      id: "006",
      name: "Halogen Lamp",
      category: "Lamps",
      price: "Php 780.00",
      stock: 20,
      status: "Transferred",
      description: "Bright halogen lamp for outdoor use.",
    },
    {
      id: "007",
      name: "Solar Light",
      category: "Outdoor",
      price: "Php 1,200.00",
      stock: 15,
      status: "Transferred",
      description: "Solar powered outdoor light with motion sensor.",
    },
  ]);

  // State to track selected products
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Search term state
  const [searchTerm, setSearchTerm] = useState("");

  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      products.map((product) => product.category)
    );
    return ["All", ...Array.from(uniqueCategories)];
  }, [products]);

  // Filter products based on search term and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "All" || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all products on current page
  const selectAllOnPage = () => {
    const pageProductIds = paginatedProducts.map((product) => product.id);
    if (selectedProducts.length === pageProductIds.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(pageProductIds);
    }
  };

  // Remove selected products
  const removeSelectedProducts = () => {
    setProducts((prev) =>
      prev.filter((product) => !selectedProducts.includes(product.id))
    );
    setSelectedProducts([]);
  };

  const mockExport = () => {
    alert(
      "Export to Excel functionality would be implemented here in a real application"
    );
    console.log("Data that would be exported:", filteredProducts);
  };
  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
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

          {/* Filter, Search, and Export Controls in one line */}
          <div className="flex flex-col sm:flex-row items-center  gap-2 mb-4">
            <div className="relative w-full sm:w-1/3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or SKU..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="w-full sm:w-1/4">
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-1/4 flex items-center gap-1">
              <button
                onClick={mockExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  ></path>
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={
                        paginatedProducts.length > 0 &&
                        paginatedProducts.every((product) =>
                          selectedProducts.includes(product.id)
                        )
                      }
                      onChange={selectAllOnPage}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
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
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((product) => (
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
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No products found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4">
              <div className="mb-2 sm:mb-0">
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredProducts.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{filteredProducts.length}</span>{" "}
                  results
                </p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? "bg-gray-200 cursor-not-allowed"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded ${
                        currentPage === page
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? "bg-gray-200 cursor-not-allowed"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-100">
          <small className="text-gray-500">Last updated 3 mins ago</small>
        </div>
      </div>
    </div>
  );
}

export default Transferred;
