import { useState } from "react";
import { useSidebar } from "../Sidebar/SidebarContext";
import { Toaster } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
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
    {
      id: "003",
      name: "Keyboard",
      category: "Peripherals",
      price: "Php 1200.00",
      stock: 30,
      status: "Transferred",
      description: "Mechanical keyboard with RGB lighting.",
    },
    {
      id: "004",
      name: "Monitor",
      category: "Displays",
      price: "Php 8999.99",
      stock: 10,
      status: "In-Transit",
      description: "27-inch 4K monitor with HDR support.",
    },
    {
      id: "005",
      name: "Headphones",
      category: "Audio",
      price: "Php 2500.50",
      stock: 5,
      status: "Low Stock",
      description: "Noise-cancelling wireless headphones.",
    },
  ]);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmModalContent, setConfirmModalContent] = useState<{
    title: string;
    message: string;
    action: () => void;
  }>({ title: "", message: "", action: () => {} });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 3;

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filter products based on search and filters
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || product.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Mock export function
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
          <div className="flex items-center gap-4 mb-3.5">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h5 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Requested Items
            </h5>
          </div>

          {/* Control Bar with Filters, Search, Export, and Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            {/* Filters and Search */}
            <div className="flex flex-col lg:flex-row gap-2 w-full sm:w-auto">
              {/* Search with icon */}
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-400"
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
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="p-2 border border-gray-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 border-radius-lg"
              >
                <option
                  value="all"
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
                  value="Transferred"
                  className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                >
                  Transferred
                </option>
                <option
                  value="In-Transit"
                  className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                >
                  In-Transit
                </option>
                <option
                  value="Low Stock"
                  className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                >
                  Low Stock
                </option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="p-2 border border-gray-300 dark:border-neutral-600 rounded text-sm bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                <option
                  value="all"
                  className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                >
                  All Categories
                </option>
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                    className="border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  >
                    {category}
                  </option>
                ))}
              </select>

              {/* Export Button */}
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
            <table className="min-w-full bg-white dark:bg-neutral-800">
              <thead>
                <tr className="bg-gray-100 dark:bg-neutral-700">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    SKU/CODE
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((product) => (
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
                      <td
                        className={`px-4 py-2 text-sm font-medium ${
                          product.status === "Pending"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : product.status === "Transferred"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {product.status}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveRequest(product.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No products found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls - Bottom */}
          {filteredProducts.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing{" "}
                {filteredProducts.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}
                -{Math.min(currentPage * itemsPerPage, filteredProducts.length)}{" "}
                of {filteredProducts.length} items
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
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
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages || totalPages === 0
                      ? "bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400 cursor-not-allowed"
                      : "bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-100 dark:bg-neutral-700 border-t border-gray-200 dark:border-neutral-600">
          <small className="text-gray-500 dark:text-gray-400">
            Last updated 3 mins ago
          </small>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-black/30 to-black/70 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-lg p-6 border border-gray-200 dark:border-neutral-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Edit Request
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-2.5 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editedProduct.name || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={editedProduct.category || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price
                </label>
                <input
                  type="text"
                  name="price"
                  value={editedProduct.price || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  name="stock"
                  value={editedProduct.stock || 0}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editedProduct.description || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
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
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
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
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-black/30 to-black/70 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg w-full max-w-md p-6 border border-gray-200 dark:border-neutral-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {confirmModalContent.title}
            </h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              {confirmModalContent.message}
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeConfirmModal}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                No
              </button>
              <button
                onClick={() => {
                  confirmModalContent.action();
                  closeConfirmModal();
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
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
