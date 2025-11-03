import { useState, useMemo, useEffect, useCallback, memo, useRef } from "react";
import { useSidebar } from "../Sidebar/SidebarContext";
import {
  ArrowLeft,
  Box,
  ChevronLeft,
  ChevronRight,
  CoinsIcon,
  Download,
  FileSearch,
  Package,
  Repeat,
} from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useErrorHandler } from "../../utils/errorHandler";
import { API_BASE_URL } from "../../config/config";

// Define interface for Transferred Product data
interface TransferredProduct {
  id: number;
  product_id: number;
  product_name: string;
  category_name: string;
  price: number;
  quantity: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  arrived_at?: string;
  transferred_from: string;
  transferred_at: string;
  request_id: number;
  source: "Transferred";
  // Additional useful information
  total_value: number;
  requester_name: string;
  transfer_status: "Completed" | "Pending" | "Partial";
  notes?: string;
}

const Transferred = memo(() => {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { handleError } = useErrorHandler();

  // State for transferred products
  const [products, setProducts] = useState<TransferredProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  // State to track selected products
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  // Search term state
  const [searchTerm, setSearchTerm] = useState("");

  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch transferred products
  const fetchTransferredProducts = useCallback(async () => {
    if (
      !currentUser?.user_id ||
      !currentUser?.branch_id ||
      isFetchingRef.current
    )
      return;

    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/transfers/${currentUser.branch_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transferred products");
      }

      const arrivedItems = await response.json();

      // Transform the data into the required format
      const transferredProducts: TransferredProduct[] = arrivedItems.map(
        (item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product?.product_name || "Unknown Product",
          category_name: item.product?.category_name || "Uncategorized",
          price: item.product?.price || 0,
          quantity: item.quantity || 0,
          status:
            item.quantity === 0
              ? "Out of Stock"
              : item.quantity < 20
              ? "Low Stock"
              : "In Stock",
          transferred_at: item.transferred_at,
          arrived_at: item.transferred_at,
          request_id: item.request_id || 0,
          transferred_from:
            item.source_branch?.location ||
            item.transferred_from ||
            "Main Branch",
          source: "Transferred",
          total_value: (item.quantity || 0) * (item.product?.price || 0),
          requester_name: currentUser?.name || "Unknown",
          transfer_status: item.status || "Completed",
          notes: `Transferred on ${new Date(
            item.transferred_at
          ).toLocaleDateString()}`,
        })
      );

      console.log("Transferred products found:", transferredProducts.length);
      setProducts(transferredProducts);
    } catch (error) {
      console.error("Error fetching transferred products:", error);
      setError("Unable to load transferred products. Please try again.");
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [currentUser?.user_id, currentUser?.branch_id]);

  // Fetch data on component mount
  useEffect(() => {
    if (currentUser?.user_id && currentUser?.branch_id) {
      fetchTransferredProducts();
    }
  }, [currentUser?.user_id, currentUser?.branch_id, fetchTransferredProducts]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      products.map((product) => product.category_name)
    );
    return ["All", ...Array.from(uniqueCategories)];
  }, [products]);

  // Filter products based on search term and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toString().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "All" || product.category_name === categoryFilter;
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
  const toggleProductSelection = (productId: number) => {
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

  const handleExport = useCallback(() => {
    try {
      const exportData = filteredProducts.map((product) => ({
        "Product ID": product.id,
        "Product Name": product.product_name,
        Category: product.category_name,
        Price: `₱${product.price.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        Quantity: product.quantity,
        "Total Value": `₱${product.total_value.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        "Stock Status": product.status,
        "Transferred From": product.transferred_from,
        "Request ID": product.request_id,
        "Transferred At": new Date(product.transferred_at).toLocaleDateString(),
        "Transfer Status": product.transfer_status,
        Requester: product.requester_name,
      }));

      // Create CSV content
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers
            .map((header) => `"${row[header as keyof typeof row]}"`)
            .join(",")
        ),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transferred-products-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = handleError(error, "Export transferred products");
      console.error("Export error:", errorMessage);
    }
  }, [filteredProducts]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "ml-5" : "ml-1"
        } p-2 sm:p-4 dark:bg-neutral-900 min-h-screen`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">
              Loading transferred products...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "ml-5" : "ml-1"
        } p-2 sm:p-4 dark:bg-neutral-900 min-h-screen`}
      >
        <div className="flex items-center justify-center h-64 dark:bg-gray-900/70">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-gray-900/70 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Connection Error
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                <p className="mb-2">To fix this issue:</p>
                <ul className="text-left space-y-1">
                  <li>
                    • Make sure the backend server is running on port 5000
                  </li>
                  <li>• Check your internet connection</li>
                  <li>• Verify the API endpoints are accessible</li>
                </ul>
              </div>
            </div>
            <button
              onClick={fetchTransferredProducts}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 dark:bg-gray-900/70 min-h-screen`}
    >
      <div className="bg-white dark:bg-gray-900/70 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-neutral-700">
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h5 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Transferred Items
              </h5>
            </div>

            {selectedProducts.length > 0 && (
              <button
                onClick={removeSelectedProducts}
                className="bg-red-500 px-4 py-2 neumorphic-button-transparent rounded hover:bg-red-600 text-red-600 dark:text-red-600 transition-colors outline-1 dark:outline-1"
              >
                Remove Selected ({selectedProducts.length})
              </button>
            )}
          </div>

          {/* Summary Statistics */}
          {products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Total Items */}
              <div
                className="bg-white dark:bg-gray-900/70 rounded-2xl border border-gray-200 dark:border-neutral-700
                  shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.6)]
                  dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(60,60,60,0.4)]
                  p-4 hover:shadow-[6px_6px_20px_rgba(0,0,0,0.12),-6px_-6px_20px_rgba(255,255,255,0.3)]
                  dark:hover:shadow-[6px_6px_20px_rgba(0,0,0,0.8),-6px_-6px_20px_rgba(60,60,60,0.5)]
                  transition-all duration-300"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Box className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Items
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {products.reduce((sum, product) => sum + product.quantity, 0)}
                </div>
              </div>

              {/* Total Value */}
              <div className="bg-white dark:bg-gray-900/70 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.6)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(60,60,60,0.4)] p-4 hover:shadow-[6px_6px_20px_rgba(0,0,0,0.12),-6px_-6px_20px_rgba(255,255,255,0.3)] dark:hover:shadow-[6px_6px_20px_rgba(0,0,0,0.8),-6px_-6px_20px_rgba(60,60,60,0.5)] transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <CoinsIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Value
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₱
                  {products
                    .reduce((sum, product) => sum + product.total_value, 0)
                    .toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </div>
              </div>

              {/* Unique Products */}
              <div className="bg-white dark:bg-gray-900/70 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.6)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(60,60,60,0.4)] p-4 hover:shadow-[6px_6px_20px_rgba(0,0,0,0.12),-6px_-6px_20px_rgba(255,255,255,0.3)] dark:hover:shadow-[6px_6px_20px_rgba(0,0,0,0.8),-6px_-6px_20px_rgba(60,60,60,0.5)] transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Unique Products
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {products.length}
                </div>
              </div>

              {/* Transfer Requests */}
              <div className="bg-white dark:bg-gray-900/70 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.6)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(60,60,60,0.4)] p-4 hover:shadow-[6px_6px_20px_rgba(0,0,0,0.12),-6px_-6px_20px_rgba(255,255,255,0.3)] dark:hover:shadow-[6px_6px_20px_rgba(0,0,0,0.8),-6px_-6px_20px_rgba(60,60,60,0.5)] transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <Repeat className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Transfer Requests
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(products.map((p) => p.request_id)).size}
                </div>
              </div>
            </div>
          )}

          {/* Filter, Search, and Export Controls in one line with Neumorphic Style */}
          <div
            className="flex flex-wrap sm:flex-nowrap items-end gap-3 p-3 bg-white dark:bg-gray-900/70 rounded-2xl
             shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.6)]
             dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(60,60,60,0.4)] mb-4"
          >
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] sm:w-1/3 dark:bg-gray-900/70">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileSearch className="text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search by name or SKU..."
                className="block w-full pl-10 pr-4 py-2 rounded-2xl text-sm
                 bg-white dark:bg-gray-900/70 text-gray-900 dark:text-gray-100
                 border border-gray-300 dark:border-gray-600
                 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
                 dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Category Filter */}
            <div className="flex-shrink-0 w-full sm:w-1/4">
              <select
                className="block w-full px-4 py-2 rounded-2xl text-sm
                 bg-white dark:bg-gray-900/70 text-gray-900 dark:text-gray-100
                 border border-gray-300 dark:border-gray-600
                 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
                 dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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

            {/* Export Button */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl
             neumorphic-button-transparent text-green-600 dark:text-green-400
             hover:bg-green-700 hover:text-green-500 dark:hover:text-green-300
             transition-colors whitespace-nowrap outline-1 dark:outline-1"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="w-full overflow-hidden">
            <div className="w-full">
              <table className="w-full bg-white dark:bg-gray-900/70 text-base table-auto break-words">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-900/70">
                    <th className="px-2 py-2 text-left text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={
                          paginatedProducts.length > 0 &&
                          paginatedProducts.every((product) =>
                            selectedProducts.includes(product.id)
                          )
                        }
                        onChange={selectAllOnPage}
                        className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 rounded focus:ring-blue-500 dark:bg-neutral-700"
                      />
                    </th>
                    <th className="px-2 py-2 text-left text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      SKU/CODE
                    </th>
                    <th className="px-2 py-2 text-left text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Product Name
                    </th>
                    <th className="px-2 py-2 text-left text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Category
                    </th>
                    <th className="px-2 py-2 text-left text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Price
                    </th>
                    <th className="px-2 py-2 text-left text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Quantity
                    </th>
                    <th className="px-2 py-2 text-left text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-2 py-2 text-left text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Transferred From
                    </th>
                    <th className="px-2 py-2 text-left text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Total Value
                    </th>
                    <th className="px-2 py-2 text-left text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Request ID
                    </th>
                    <th className="px-2 py-2 text-left text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Transferred At
                    </th>
                    <th className="px-2 py-2 text-left text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Transfer Status
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
                        <td className="px-2 py-2 break-words">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 rounded focus:ring-blue-500 dark:bg-neutral-700"
                          />
                        </td>
                        <td className="px-2 py-2 font-mono break-words">
                          {product.id}
                        </td>
                        <td className="px-2 py-2 break-words">
                          {product.product_name}
                        </td>
                        <td className="px-2 py-2 break-words">
                          {product.category_name}
                        </td>
                        <td className="px-2 py-2 break-words">
                          ₱
                          {product.price.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-2 py-2 break-words">
                          {product.quantity}
                        </td>
                        <td
                          className={`px-2 py-2 font-semibold break-words ${
                            product.status === "In Stock"
                              ? "text-green-600 dark:text-green-400"
                              : product.status === "Low Stock"
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {product.status}
                        </td>
                        <td className="px-2 py-2 break-words">
                          {product.transferred_from}
                        </td>
                        <td className="px-2 py-2 font-semibold break-words">
                          ₱
                          {product.total_value.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-2 py-2 font-mono break-words">
                          #{product.request_id}
                        </td>
                        <td className="px-2 py-2 break-words">
                          {new Date(
                            product.transferred_at
                          ).toLocaleDateString()}
                        </td>
                        <td
                          className={`px-2 py-2 font-semibold break-words ${
                            product.transfer_status === "Completed"
                              ? "text-green-600 dark:text-green-400"
                              : product.transfer_status === "Pending"
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {product.transfer_status}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-3 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        {products.length === 0
                          ? "No transferred products found. Products will appear here once they are transferred from other branches to this branch."
                          : "No transferred products found matching your criteria"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4">
              {/* Results Info */}
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Showing{" "}
                  <span className="font-semibold text-base sm:text-lg">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-base sm:text-lg">
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredProducts.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-base sm:text-lg">
                    {filteredProducts.length}
                  </span>{" "}
                  results
                </p>
              </div>

              {/* Pagination Controls */}
              <div className="flex space-x-2">
                {/* Previous */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all
        ${
          currentPage === 1
            ? "text-gray-400 dark:text-neutral-500 cursor-not-allowed bg-gray-100 dark:bg-neutral-800 shadow-inner"
            : "text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(50,50,50,0.3)] hover:scale-[1.05]"
        }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all
          ${
            currentPage === page
              ? "bg-blue-500 text-white shadow-md scale-[1.05]"
              : "bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(60,60,60,0.3)] hover:scale-[1.05]"
          }`}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all
        ${
          currentPage === totalPages
            ? "text-gray-400 dark:text-neutral-500 cursor-not-allowed bg-gray-100 dark:bg-neutral-800 shadow-inner"
            : "text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(50,50,50,0.3)] hover:scale-[1.05]"
        }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-100 dark:bg-gray-900/70 border-t border-gray-200 dark:border-neutral-600">
          <small className="text-gray-500 dark:text-gray-400">
            Last updated {new Date().toLocaleTimeString()}
          </small>
        </div>
      </div>
    </div>
  );
});

Transferred.displayName = "Transferred";

export default Transferred;
