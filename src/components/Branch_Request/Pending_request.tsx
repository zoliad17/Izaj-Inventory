import { useState, useMemo } from "react";
import { useSidebar } from "../Sidebar/SidebarContext";
import { Toaster } from "react-hot-toast";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
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
    {
      id: "002",
      name: "Smart Plug",
      category: "Accessories",
      price: "Php 599.99",
      stock: 50,
      status: "Approved",
      imageUrl: "plug1.jpg",
      description: "WiFi enabled smart plug with energy monitoring.",
    },
    {
      id: "003",
      name: "Solar Panel",
      category: "Renewable",
      price: "Php 12,499.99",
      stock: 15,
      status: "Rejected",
      imageUrl: "solar1.jpg",
      description: "300W monocrystalline solar panel with high efficiency.",
    },
    {
      id: "004",
      name: "Battery Pack",
      category: "Storage",
      price: "Php 8,999.99",
      stock: 20,
      status: "Pending",
      imageUrl: "battery1.jpg",
      description: "10kWh lithium-ion home battery storage system.",
    },
    {
      id: "005",
      name: "LED Strip",
      category: "Lighting",
      price: "Php 1,299.99",
      stock: 75,
      status: "Approved",
      imageUrl: "strip1.jpg",
      description: "RGB LED strip with remote control and adhesive backing.",
    },
    {
      id: "006",
      name: "Motion Sensor",
      category: "Sensors",
      price: "Php 899.99",
      stock: 40,
      status: "Pending",
      imageUrl: "sensor1.jpg",
      description: "Wireless motion sensor for home automation systems.",
    },
  ]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionType, setActionType] = useState<"accept" | "decline" | null>(
    null
  );

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(uniqueCategories)];
  }, [products]);

  // Filter products based on all criteria
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.price.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Approved" && product.status === "Approved") ||
        (statusFilter === "Rejected" && product.status === "Rejected") ||
        (statusFilter === "Pending" && product.status === "Pending");

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handleActionClick = (
    product: Product,
    action: "accept" | "decline"
  ) => {
    setSelectedProduct(product);
    setActionType(action);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setActionType(null);
  };

  const confirmAction = () => {
    if (selectedProduct && actionType) {
      const updatedProducts = products.map((p) => {
        if (p.id === selectedProduct.id) {
          return {
            ...p,
            status: (actionType === "accept"
              ? "Approved"
              : "Rejected") as Product["status"],
          };
        }
        return p;
      });

      setProducts(updatedProducts);
      alert(`Request ${actionType === "accept" ? "Accepted" : "Declined"}!`);
      toast.info(
        `Request ${actionType === "accept" ? "Accepted" : "Declined"}!`
      );
    }
    closeModal();
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
      } p-2 sm:p-4 dark:bg-neutral-900 min-h-screen`}
    >
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-neutral-700">
        {/* Toaster for success and error */}
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h5 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Pending Request
              </h5>
            </div>
          </div>

          {/* Compact Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-grow max-w-xs">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>

            <select
              className="border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                  className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                >
                  {category === "All" ? "All Categories" : category}
                </option>
              ))}
            </select>

            <select
              className="border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option
                value="All"
                className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                All Status
              </option>
              <option
                value="Pending"
                className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                Pending
              </option>
              <option
                value="Approved"
                className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                Approved
              </option>
              <option
                value="Rejected"
                className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                Rejected
              </option>
            </select>

            <select
              className="border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option
                value="5"
                className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                5 per page
              </option>
              <option
                value="10"
                className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                10 per page
              </option>
              <option
                value="20"
                className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                20 per page
              </option>
              <option
                value="50"
                className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                50 per page
              </option>
            </select>

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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-neutral-800">
              <thead>
                <tr className="bg-gray-100 dark:bg-neutral-700">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product ID
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Price
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantity
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-700/50"
                    >
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {product.id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {product.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {product.category}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {product.price}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {product.stock}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.status === "Approved"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : product.status === "Rejected"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleActionClick(product, "accept")}
                            disabled={product.status !== "Pending"}
                            className={`px-3 py-1 rounded-md text-sm font-medium ${
                              product.status !== "Pending"
                                ? "bg-gray-200 text-gray-500 dark:bg-neutral-700 dark:text-neutral-400 cursor-not-allowed"
                                : "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                            }`}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleActionClick(product, "decline")
                            }
                            disabled={product.status !== "Pending"}
                            className={`px-3 py-1 rounded-md text-sm font-medium ${
                              product.status !== "Pending"
                                ? "bg-gray-200 text-gray-500 dark:bg-neutral-700 dark:text-neutral-400 cursor-not-allowed"
                                : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                            }`}
                          >
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      No products found matching your filter criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredProducts.length)} of{" "}
              {filteredProducts.length} entries
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${
                  currentPage === 1
                    ? "bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400 cursor-not-allowed"
                    : "bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300"
                }`}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === page
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300"
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
                className={`px-3 py-1 rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400 cursor-not-allowed"
                    : "bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-100 dark:bg-neutral-700 border-t border-gray-200 dark:border-neutral-600">
          <small className="text-gray-500 dark:text-gray-400">
            Last updated 3 mins ago
          </small>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && selectedProduct && actionType && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-md p-6 border border-gray-200 dark:border-neutral-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Confirm {actionType === "accept" ? "Acceptance" : "Rejection"}
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Are you sure you want to {actionType} the product{" "}
              <span className="font-semibold">{selectedProduct.name}</span> (ID:{" "}
              {selectedProduct.id})?
            </p>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`${
                  actionType === "accept"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                } text-white px-4 py-2 rounded transition-colors`}
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
