import { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowLeft,
  Trash2,
  Package,
  MapPin,
  Send,
  ShoppingCart,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../utils/apiClient";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import SuccessNotification from "../ui/SuccessNotification";
import { useSidebar } from "../Sidebar/SidebarContext";

interface Product {
  id: number;
  product_name: string;
  quantity: number; // Available quantity (total - reserved)
  total_quantity: number; // Total quantity in inventory
  reserved_quantity: number; // Currently reserved quantity
  price: number;
  category_name: string;
  status: string;
}

interface RequestItem {
  product_id: number;
  product_name: string;
  quantity: number;
  available_quantity: number;
  price: number;
  category_name: string;
}

export default function UnifiedProductRequest() {
  const { isCollapsed } = useSidebar();
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  // State for products and branch info
  const [products, setProducts] = useState<Product[]>([]);
  const [branchName, setBranchName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [branchLoading, setBranchLoading] = useState(true);

  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 5;

  // State for request functionality
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequestSummary, setShowRequestSummary] = useState(false);

  // State for success notification
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successData, setSuccessData] = useState<{
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    requestId: string;
    branchName: string;
  } | null>(null);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      console.error("User not authenticated or user data missing");
      toast.error("Please log in to continue");
      navigate("/login");
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Fetch branch info
  useEffect(() => {
    if (!branchId) return;
    const fetchBranch = async () => {
      try {
        setBranchLoading(true);
        console.log(
          "Fetching branch info for ID:",
          branchId,
          "Type:",
          typeof branchId
        );
        const { data, error } = await api.getBranches();
        console.log("Branches API response:", { data, error });

        const branchData = Array.isArray(data)
          ? data.find((b: any) => b.id === Number(branchId))
          : null;
        console.log("Found branch data:", branchData);

        if (!error && branchData) {
          setBranchName(branchData.location);
          console.log("Branch name set:", branchData.location);
        } else {
          console.error(
            "Branch not found for ID:",
            branchId,
            "Available branches:",
            data
          );
        }
      } catch (error) {
        console.error("Error fetching branch:", error);
      } finally {
        setBranchLoading(false);
      }
    };
    fetchBranch();
  }, [branchId]);

  // Check if target branch has users before fetching products
  useEffect(() => {
    if (!branchId) return;

    const validateBranchUsers = async () => {
      try {
        setIsLoading(true);

        // First check if the target branch has any users
        const { data: users, error: usersError } = await api.getUsers(
          Number(branchId)
        );

        if (usersError) {
          console.error("Error checking branch users:", usersError);
          toast.error("Failed to validate branch. Please try again.");
          navigate("/branch_location");
          return;
        }

        if (!users || !Array.isArray(users) || users.length === 0) {
          console.error("No users found in target branch:", branchId);
          toast.error(
            "This branch has no registered users. Cannot proceed with requests."
          );
          navigate("/branch_location");
          return;
        }

        // Check if there's at least one Branch Manager
        const hasBranchManager = users.some((user: any) => {
          const roleName = user.role?.role_name || user.role_name;
          return roleName === "Branch Manager" || roleName === "BranchManager";
        });

        if (!hasBranchManager) {
          console.error("No Branch Manager found in target branch:", branchId);
          toast.error(
            "This branch has no Branch Manager. Cannot proceed with requests."
          );
          navigate("/branch_location");
          return;
        }

        // If validation passes, fetch products
        const response = await fetch(
          `http://localhost:5000/api/branches/${branchId}/products`
        );
        if (!response.ok) throw new Error("Failed to fetch products");

        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error validating branch or loading products:", error);
        toast.error("Failed to load branch data");
        navigate("/branch_location");
      } finally {
        setIsLoading(false);
      }
    };

    validateBranchUsers();
  }, [branchId, navigate]);

  // Get unique categories for filter
  const categories = ["All", ...new Set(products.map((p) => p.category_name))];
  const statuses = ["All", "In Stock", "Low Stock", "Out of Stock"];

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toString().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" || product.category_name === categoryFilter;
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

  // Add product to request
  const addToRequest = (product: Product) => {
    const existingItem = requestItems.find(
      (item) => item.product_id === product.id
    );

    if (existingItem) {
      toast.error("Product already in request list");
      return;
    }

    if (product.quantity <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    const newItem: RequestItem = {
      product_id: product.id,
      product_name: product.product_name,
      quantity: 1,
      available_quantity: product.quantity, // Available quantity (total - reserved)
      price: product.price,
      category_name: product.category_name,
    };

    setRequestItems([...requestItems, newItem]);
    toast.success("Product added to request");
  };

  // Remove product from request
  const removeFromRequest = (productId: number) => {
    setRequestItems(
      requestItems.filter((item) => item.product_id !== productId)
    );
  };

  // Update quantity in request
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) return;

    setRequestItems(
      requestItems.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: Math.min(quantity, item.available_quantity) }
          : item
      )
    );
  };

  // Validate and submit request
  const handleSubmitRequest = async () => {
    if (!currentUser || !branchId) {
      toast.error("User information not found");
      return;
    }

    if (requestItems.length === 0) {
      toast.error("Please add at least one product to request");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Starting request submission...", {
        branchId,
        currentUser,
        requestItems,
      });

      // Validate current user exists in database
      if (!currentUser?.user_id) {
        throw new Error("Invalid user session. Please log in again.");
      }

      // Find the branch manager of the selected branch
      const { data: users, error: usersError } = await api.getUsers(
        Number(branchId)
      );
      console.log("Users response:", { users, usersError });

      if (usersError) {
        throw new Error(usersError);
      }

      if (!users || !Array.isArray(users)) {
        throw new Error("No users found for this branch");
      }

      // Validate that current user is from a different branch (makes sense for requests)
      if (currentUser.branch_id === Number(branchId)) {
        console.error("Current user is from the same branch as target branch");
        toast.error(
          "You cannot request products from your own branch. Please select a different branch."
        );
        navigate("/branch_location");
        return;
      }

      console.log(
        "Target branch validation passed - branch has users and Branch Manager"
      );

      // Find the branch manager - users already have role information from the API
      const branchManager = users.find((user: any) => {
        const roleName = user.role?.role_name || user.role_name;
        return (
          user.branch_id === Number(branchId) &&
          (roleName === "Branch Manager" || roleName === "BranchManager")
        );
      });

      console.log("Branch manager found:", branchManager);

      if (!branchManager) {
        toast.error("No branch manager found for the selected branch");
        return;
      }

      const requestData = {
        requestFrom: currentUser.user_id,
        requestTo: branchManager.user_id,
        items: requestItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        notes: notes.trim() || null,
      };

      console.log("Request data:", requestData);

      const { error: requestError } = await api.createProductRequest(
        requestData
      );
      console.log("Request response:", { requestError });

      if (requestError) {
        throw new Error(requestError);
      }

      // Enhanced success message with detailed information
      const totalItems = requestItems.length;
      const totalQuantity = requestItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const totalValue = requestItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const requestId = Date.now().toString().slice(-6);

      // Set success data and show notification
      setSuccessData({
        totalItems,
        totalQuantity,
        totalValue,
        requestId,
        branchName,
      });
      setShowSuccessNotification(true);

      // Reset form
      setRequestItems([]);
      setNotes("");
      setShowRequestSummary(false);
    } catch (error) {
      console.error("Error submitting request:", error);

      // Handle rate limiting specifically
      if (error instanceof Error && error.message.includes("429")) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else if (error instanceof Error && error.message.includes("Too many")) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to submit request";
        console.error("Request submission failed:", errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock export function
  const mockExport = () => {
    alert(
      "Export to Excel functionality would be implemented here in a real application"
    );
    console.log("Data that would be exported:", filteredProducts);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">
            Loading products...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      }  sm:p-4`}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Arrow and Title in one row */}
              <button
                onClick={() => navigate("/branch_location")}
                className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                {branchLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    Loading Branch...
                  </span>
                ) : (
                  `${
                    branchName || `Branch ${branchId}`
                  } - Browse & Request Products`
                )}
              </h1>
            </div>

            {/* Request Summary Button */}
            {requestItems.length > 0 && (
              <button
                onClick={() => setShowRequestSummary(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                Request Cart ({requestItems.length})
              </button>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Browse available products from{" "}
            {branchLoading
              ? "loading branch..."
              : branchName || `Branch ${branchId}`}{" "}
            and add them to your request
          </p>
          <div className="mt-3 space-y-2">
            <div className="text-sm text-gray-500 dark:text-gray-400 bg-green-50 dark:bg-green-900 p-2 rounded-md">
              <strong>Inventory Legend:</strong>
              <span className="text-green-600 dark:text-green-400 ml-2">
                Available
              </span>{" "}
              = Ready to request,
              <span className="text-orange-600 dark:text-orange-400 ml-2">
                Reserved
              </span>{" "}
              = Pending approval,
              <span className="text-blue-600 dark:text-blue-400 ml-2">
                Total
              </span>{" "}
              = Complete inventory
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative flex-grow w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <select
                className="text-sm focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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

            {/* Status Filter */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <select
                className="text-sm focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={mockExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors whitespace-nowrap"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-900">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reserved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentProducts.length > 0 ? (
                  currentProducts.map((product) => {
                    const isInRequest = requestItems.some(
                      (item) => item.product_id === product.id
                    );
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {product.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {product.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {product.category_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          ₱{product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                          <span className="font-medium">
                            {product.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 dark:text-orange-400">
                          <span className="font-medium">
                            {product.reserved_quantity || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                          <span className="font-medium">
                            {product.total_quantity || product.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.status === "In Stock"
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400"
                                : product.status === "Low Stock"
                                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-400"
                                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-400"
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {isInRequest ? (
                            <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              In Cart
                            </span>
                          ) : (
                            <button
                              onClick={() => addToRequest(product)}
                              disabled={product.quantity <= 0}
                              className={`px-4 py-2 rounded-md font-medium transition-colors
                                    ${
                                      product.quantity <= 0
                                        ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 dark:from-blue-400 dark:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-800"
                                    }`}
                            >
                              Request
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                    >
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
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
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? "z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300"
                              : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Request Summary Modal */}
      {showRequestSummary && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Request Summary
              </h3>
              <button
                onClick={() => setShowRequestSummary(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Branch Info */}
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-200">
                  Requesting from:
                </span>
                <span className="text-blue-700 dark:text-blue-300">
                  {branchName}
                </span>
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-300">
                <p>• Products will be reserved until approval</p>
                <p>• Branch Manager will review your request</p>
                <p>• You'll be notified of the decision</p>
              </div>
            </div>

            {/* Request Items */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Request Items:
              </h4>
              <div className="space-y-3">
                {requestItems.map((item) => (
                  <div
                    key={item.product_id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {item.product_name}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {item.category_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          ₱{item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity - 1)
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.available_quantity}
                            value={item.quantity}
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value) || 1;
                              updateQuantity(item.product_id, newQuantity);
                            }}
                            className="w-16 text-center border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity + 1)
                            }
                            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromRequest(item.product_id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      Available: {item.available_quantity} | Total: ₱
                      {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Add any additional information about this request..."
              />
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Request Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    Total Items:
                  </span>
                  <p className="text-gray-600 dark:text-gray-300">
                    {requestItems.length} product
                    {requestItems.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    Total Quantity:
                  </span>
                  <p className="text-gray-600 dark:text-gray-300">
                    {requestItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    units
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    Estimated Value:
                  </span>
                  <p className="text-gray-600 dark:text-gray-300 font-semibold">
                    ₱
                    {requestItems
                      .reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      )
                      .toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    Request Status:
                  </span>
                  <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                    Pending Approval
                  </p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Note:</strong> This request will be sent to the Branch
                  Manager of {branchName} for review. You will receive a
                  notification once the request is processed.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRequestSummary(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={isSubmitting || requestItems.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {showSuccessNotification && successData && (
        <SuccessNotification
          totalItems={successData.totalItems}
          totalQuantity={successData.totalQuantity}
          totalValue={successData.totalValue}
          requestId={successData.requestId}
          branchName={successData.branchName}
          onClose={() => {
            setShowSuccessNotification(false);
            setSuccessData(null);
            navigate("/branch_location");
          }}
        />
      )}
    </div>
  );
}
