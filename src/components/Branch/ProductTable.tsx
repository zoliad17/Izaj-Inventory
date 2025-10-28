import { useEffect, useState } from "react";
import { useSidebar } from "../Sidebar/SidebarContext";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../utils/apiClient";
import { Branch, Product as ApiProduct } from "../../types/api";
import * as XLSX from "xlsx";
import { toast, Toaster } from "react-hot-toast";

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
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestQuantity, setRequestQuantity] = useState<{
    [key: string]: number;
  }>({});
  const [currentRequestProduct, setCurrentRequestProduct] =
    useState<Product | null>(null);
  const productsPerPage = 5;

  // State for fetched products and branch name
  const [products, setProducts] = useState<Product[]>([]);
  const [branchName, setBranchName] = useState<string>("");

  // Fetch branch name/location
  useEffect(() => {
    if (!branchId) return;
    const fetchBranch = async () => {
      try {
        const { data: branches, error } = await api.getBranches();
        if (!error && Array.isArray(branches)) {
          const branch = branches.find(
            (b: Branch) => b.id === Number(branchId)
          );
          setBranchName(branch?.location || "");
        } else {
          setBranchName("");
          console.error("Error fetching branch:", error);
        }
      } catch (error) {
        console.error("Error fetching branch:", error);
        setBranchName("");
      }
    };
    fetchBranch();
  }, [branchId]);

  // Fetch products for this branch
  useEffect(() => {
    if (!branchId) return;
    const fetchProducts = async () => {
      try {
        const { data, error } = await api.getProducts(Number(branchId));
        if (!error && Array.isArray(data)) {
          setProducts(
            data.map((p: ApiProduct) => ({
              id: p.id.toString(),
              name: p.product_name,
              category: p.category_name || "",
              price: p.price ? `Php ${Number(p.price).toFixed(2)}` : "",
              stock: p.quantity,
              status:
                p.quantity === 0
                  ? "Out of Stock"
                  : p.quantity < 20
                  ? "Low Stock"
                  : "In Stock",
            }))
          );
        } else {
          console.error("Error fetching products:", error);
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      }
    };
    fetchProducts();
  }, [branchId]);

  // Get unique categories for filter dropdown
  const categories = [
    "All",
    ...new Set(products.map((product) => product.category)),
  ];
  const statuses = ["All", "In Stock", "Out of Stock", "Low Stock"];

  // Filter products based on search term and filters
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" || product.category === categoryFilter;
    const matchesStatus =
      statusFilter === "All" || product.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle product selection
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle select all products on current page
  const handleSelectAll = () => {
    if (selectedProducts.length === currentProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentProducts.map((product) => product.id));
    }
  };

  // Handle individual product request
  const handleRequestProduct = (product: Product) => {
    setCurrentRequestProduct(product);
    setRequestQuantity((prev) => ({
      ...prev,
      [product.id]: prev[product.id] || 1,
    }));
    setIsModalOpen(true);
  };

  // Handle bulk request
  const handleBulkRequest = () => {
    if (selectedProducts.length === 0) return;

    // Initialize quantities for all selected products if not already set
    const newQuantities = { ...requestQuantity };
    selectedProducts.forEach((id) => {
      if (!newQuantities[id]) {
        const product = products.find((p) => p.id === id);
        if (product) {
          newQuantities[id] = 1;
        }
      }
    });
    setRequestQuantity(newQuantities);
    setIsModalOpen(true);
  };

  // Handle request submission
  const handleSubmitRequest = () => {
    // Here you would typically send the request to your backend
    console.log("Request submitted:", {
      products: currentRequestProduct
        ? [
            {
              productId: currentRequestProduct.id,
              quantity: requestQuantity[currentRequestProduct.id] || 1,
            },
          ]
        : selectedProducts.map((id) => ({
            productId: id,
            quantity: requestQuantity[id] || 1,
          })),
    });

    // Reset and close modal
    setSelectedProducts([]);
    setIsModalOpen(false);
    setCurrentRequestProduct(null);
    alert("Request submitted successfully!");
  };

  // Excel export function
  const mockExport = () => {
    try {
      const exportData = filteredProducts.map((product) => ({
        "Product ID": product.id,
        "Product Name": product.name,
        Category: product.category,
        Price: product.price,
        Quantity: product.stock,
        Status: product.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `products_branch_${branchId}_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, filename);
      toast.success("Excel file exported successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel");
    }
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 dark:bg-neutral-900`}
    >
      <Toaster position="top-center" />
      {/* Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {currentRequestProduct
                ? `Request ${currentRequestProduct.name}`
                : "Request Multiple Products"}
            </h2>

            {currentRequestProduct ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentRequestProduct.stock}
                  value={requestQuantity[currentRequestProduct.id] || 1}
                  onChange={(e) =>
                    setRequestQuantity((prev) => ({
                      ...prev,
                      [currentRequestProduct.id]: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Available: {currentRequestProduct.stock}
                </p>
              </div>
            ) : (
              <div className="mb-4">
                {selectedProducts.map((productId) => {
                  const product = products.find((p) => p.id === productId);
                  if (!product) return null;

                  return (
                    <div key={productId} className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {product.name}
                      </label>
                      <div className="flex items-center mt-1">
                        <input
                          type="number"
                          min="1"
                          max={product.stock}
                          value={requestQuantity[productId] || 1}
                          onChange={(e) =>
                            setRequestQuantity((prev) => ({
                              ...prev,
                              [productId]: parseInt(e.target.value) || 1,
                            }))
                          }
                          className="w-full p-2 border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                        />
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          / {product.stock} available
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-neutral-700">
        <div className="p-6">
          {/* Header with search and actions */}
          <div className="flex flex-col mb-3 md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              {branchName && (
                <h5 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Branch {branchName}
                </h5>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                />
              </div>

              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg">
                  <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <select
                    className="text-sm focus:outline-none bg-transparent text-gray-900 dark:text-gray-100"
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                        className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                {/*  */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg">
                  <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <select
                    className="text-sm focus:outline-none bg-transparent text-gray-900 dark:text-gray-100"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    {statuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                        className="bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProducts.length > 0 && (
                  <button
                    onClick={handleBulkRequest}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Request Selected ({selectedProducts.length})
                  </button>
                )}

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
          </div>

          {/* Product Table */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-neutral-800">
                <thead className="bg-gray-50 dark:bg-neutral-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={
                          selectedProducts.length === currentProducts.length &&
                          currentProducts.length > 0
                        }
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 border-gray-300 dark:border-neutral-600 rounded focus:ring-blue-500 dark:bg-neutral-700"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                  {currentProducts.length > 0 ? (
                    currentProducts.map((product: Product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 dark:hover:bg-neutral-700/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 dark:border-neutral-600 rounded focus:ring-blue-500 dark:bg-neutral-700"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {product.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {product.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {product.stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.status === "In Stock"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : product.status === "Low Stock"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleRequestProduct(product)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            disabled={product.status === "Out of Stock"}
                          >
                            Request
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Pagination */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-neutral-700 border-t border-gray-200 dark:border-neutral-600 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-neutral-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-neutral-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing{" "}
                    <span className="font-medium">
                      {indexOfFirstProduct + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastProduct, filteredProducts.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredProducts.length}
                    </span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? "z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-300"
                              : "bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-700"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductTable;
