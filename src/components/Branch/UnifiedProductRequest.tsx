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
  Download,
  ChevronDown,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../utils/apiClient";
import { API_BASE_URL } from "../../config/config";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import SuccessNotification from "../ui/SuccessNotification";
import { useSidebar } from "../Sidebar/SidebarContext";
import * as XLSX from "xlsx";

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
          `${API_BASE_URL}/api/branches/${branchId}/products`
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

  // Excel export function
  const mockExport = () => {
    try {
      if (filteredProducts.length === 0) {
        toast.error("No products to export");
        return;
      }

      const exportData = filteredProducts.map((product) => ({
        "Product ID": product.id,
        "Product Name": product.product_name,
        Category: product.category_name,
        Price: `₱${product.price.toFixed(2)}`,
        "Available Quantity": product.quantity,
        "Reserved Quantity": product.reserved_quantity || 0,
        "Total Quantity": product.total_quantity || product.quantity,
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
      }  sm:p-4 dark:bg-gray-900/70 min-h-screen`}
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
                className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors neumorphic-button-transparent dark:text-blue-600 text-blue-600 dark:outline-0 outline-1"
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
          {/* Search, Filters, and Export Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 w-full">
            {/* Search Bar */}
            <div
              className="relative flex-grow w-full rounded-xl bg-transparent
    shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
    dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.7),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]
    hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]
    dark:hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.7),inset_-4px_-4px_8px_rgba(40,40,40,0.5)]
    transition-all duration-300"
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-3 w-full bg-transparent text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Category Filter */}
            <div
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-transparent
    shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
    dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.7),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]
    hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]
    dark:hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.7),inset_-4px_-4px_8px_rgba(40,40,40,0.5)]
    transition-all duration-300 w-full sm:w-auto"
            >
              <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <select
                className="appearance-none w-full bg-transparent text-gray-900 dark:text-gray-100 pl-1 pr-6 py-1 rounded-xl focus:outline-none"
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
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {category}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2">
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>

            {/* Status Filter */}
            <div
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-transparent
    shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
    dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.7),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]
    hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]
    dark:hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.7),inset_-4px_-4px_8px_rgba(40,40,40,0.5)]
    transition-all duration-300 w-full sm:w-auto"
            >
              <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <select
                className="appearance-none w-full bg-transparent text-gray-900 dark:text-gray-100 pl-1 pr-6 py-1 rounded-xl focus:outline-none"
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
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {status}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2">
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={mockExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-green-600 dark:text-green-500 font-bold bg-transparent
      shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
      dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.7),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]
      hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]
      dark:hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.7),inset_-4px_-4px_8px_rgba(40,40,40,0.5)]
      transition-all duration-300 whitespace-nowrap"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>

          {/* Products Table */}
          <div
            className="p-4 max-w-full mx-auto bg-white dark:bg-gray-900 rounded-2xl
                shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)]
                dark:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(60,60,60,0.1)]
                transition-all duration-300 overflow-hidden"
          >
            <div className="overflow-x-auto md:overflow-x-hidden">
              <table className="w-full table-auto rounded-xl border-separate border-spacing-0 text-base">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 rounded-xl">
                    {[
                      "ID",
                      "Name",
                      "Category",
                      "Price",
                      "Available",
                      "Reserved",
                      "Total",
                      "Status",
                      "Actions",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-3 py-3 text-left text-sm md:text-base font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    ))}
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
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-300 rounded-xl"
                        >
                          <td className="px-3 py-2 whitespace-nowrap text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
                            {product.id}
                          </td>
                          <td className="px-3 py-2 text-sm md:text-base text-gray-500 dark:text-gray-300 truncate max-w-[120px]">
                            {product.product_name}
                          </td>
                          <td className="px-3 py-2 text-sm md:text-base text-gray-500 dark:text-gray-300 truncate max-w-[100px]">
                            {product.category_name}
                          </td>
                          <td className="px-3 py-2 text-sm md:text-base text-gray-500 dark:text-gray-300">
                            ₱{product.price.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-sm md:text-base text-green-600 dark:text-green-400 font-medium">
                            {product.quantity}
                          </td>
                          <td className="px-3 py-2 text-sm md:text-base text-orange-600 dark:text-orange-400 font-medium">
                            {product.reserved_quantity || 0}
                          </td>
                          <td className="px-3 py-2 text-sm md:text-base text-blue-600 dark:text-blue-400 font-medium">
                            {product.total_quantity || product.quantity}
                          </td>
                          <td className="px-3 py-2 text-sm md:text-base">
                            <span
                              className={`
      px-3 py-1 rounded-full font-semibold text-xs md:text-sm
      transition-all duration-200
      ${
        product.status === "In Stock"
          ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900 shadow-neumorphic-green"
          : product.status === "Low Stock"
          ? "text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900 shadow-neumorphic-yellow"
          : "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900 shadow-neumorphic-red"
      }
    `}
                            >
                              {product.status}
                            </span>
                          </td>

                          <td className="px-3 py-2 text-sm md:text-base font-medium">
                            {isInRequest ? (
                              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="h-5 w-5" /> In Cart
                              </span>
                            ) : (
                              <button
                                onClick={() => addToRequest(product)}
                                disabled={product.quantity <= 0}
                                className={`px-3 py-1 rounded-md font-medium text-sm md:text-base neumorphic-button-transparent dark:text-blue-600 text-blue-600 dark:outline-0 outline-1
                        ${
                          product.quantity <= 0
                            ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-blue-500 cursor-not-allowed"
                            : "bg-blue-500 text-blue hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800"
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
                        className="px-3 py-4 text-center text-sm md:text-base text-gray-500 dark:text-gray-300"
                      >
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              {/* Mobile / Small Screens */}
              {/* <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div> */}

              {/* Desktop / Larger Screens */}
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Page <span className="font-medium">{currentPage}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 border rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 border rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Request Summary Modal */}
      {showRequestSummary && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 dark:bg-black/70 z-50">
          <div
            className="bg-gray-200 dark:bg-gray-900 rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto
               shadow-neumorphic-light dark:shadow-neumorphic-dark transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Request Summary
              </h3>
              <button
                onClick={() => setShowRequestSummary(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Branch Info */}
            <div className="mb-6 p-5 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-2xl shadow-neumorphic-inner">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-900 dark:text-blue-200">
                  Requesting from:
                </span>
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  {branchName}
                </span>
              </div>
              <div className="text-base text-blue-700 dark:text-blue-300 space-y-1">
                <p>• Products will be reserved until approval</p>
                <p>• Branch Manager will review your request</p>
                <p>• You'll be notified of the decision</p>
              </div>
            </div>

            {/* Request Items */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-4">
                Request Items:
              </h4>
              <div className="space-y-4">
                {requestItems.map((item) => (
                  <div
                    key={item.product_id}
                    className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-neumorphic-inner hover:shadow-neumorphic-hover transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                          {item.product_name}
                        </h5>
                        <p className="text-gray-600 dark:text-gray-300">
                          {item.category_name}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                          ₱{item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity - 1)
                            }
                            className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center
                               hover:bg-gray-50 dark:hover:bg-gray-800 shadow-neumorphic-btn transition-all"
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
                            className="w-20 text-center border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-2 text-base
                               focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                               focus:border-blue-500 dark:focus:border-blue-400 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               shadow-neumorphic-inner transition-all"
                          />
                          <button
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity + 1)
                            }
                            className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center
                               hover:bg-gray-50 dark:hover:bg-gray-800 shadow-neumorphic-btn transition-all"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromRequest(item.product_id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-gray-600 dark:text-gray-300 text-base">
                      Available: {item.available_quantity} | Total: ₱
                      {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-2xl text-base
                   focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                   focus:border-blue-500 dark:focus:border-blue-400 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   shadow-neumorphic-inner transition-all"
                placeholder="Add any additional information about this request..."
              />
            </div>

            {/* Summary */}
            <div className="mb-6 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-neumorphic-inner text-lg">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                Request Summary
              </h4>
              <div className="grid grid-cols-2 gap-5 text-base">
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
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowRequestSummary(false)}
                className="px-5 py-3 text-base rounded-2xl text-red-600 neumorphic-button-transparent bg-gray-200 dark:bg-gray-800  dark:text-red-600
                   shadow-neumorphic-btn  transition-all dark:outline-0 outline-1"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitRequest}
                disabled={isSubmitting || requestItems.length === 0}
                className="flex items-center gap-2 px-6 py-3 text-base rounded-2xl
                   bg-blue-600 dark:bg-blue-400 neumorphic-button-transparent hover:shadow-neumorphic-hover
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all dark:outline-0 outline-1 dark:text-blue-600 text-blue-600"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
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
