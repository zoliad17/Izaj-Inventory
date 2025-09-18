import { useState, useEffect } from "react";

import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Package,
  Building,
  Clock,
  RefreshCw,
  // ChevronLeft,
  // ChevronRight,
  // ChevronsLeft,
  // ChevronsRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { useSidebar } from "../Sidebar/SidebarContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  description: string;
  metadata?: any;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  old_values?: any;
  new_values?: any;
  notes?: string;
  timestamp: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
    role?: {
      role_name: string;
    };
    branch?: {
      location: string;
    };
  };
}

const UserAuditLogsPage = () => {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("ALL");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AuditLog;
    direction: "ascending" | "descending";
  }>({
    key: "timestamp",
    direction: "descending",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Get current user ID from AuthContext
  const currentUserId = user?.user_id;

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.error("User not authenticated or user data missing");
      navigate("/login");
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch user's audit logs from API
  useEffect(() => {
    const fetchUserLogs = async () => {
      console.log("UserAuditLogsPage - fetchUserLogs called", {
        currentUserId,
        user,
        isAuthenticated,
      });

      if (!currentUserId) {
        console.error("No user ID found", {
          currentUserId,
          user,
          isAuthenticated,
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        });

        if (selectedAction !== "ALL") {
          params.append("action", selectedAction);
        }
        if (selectedEntityType !== "ALL") {
          params.append("entity_type", selectedEntityType);
        }

        const response = await fetch(
          `http://localhost:5000/api/audit-logs/user/${currentUserId}?${params}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch user audit logs: ${response.status}`
          );
        }

        const data = await response.json();
        setLogs(data.logs || []);
        setFilteredLogs(data.logs || []);
        setTotalPages(data.pagination?.pages || 0);
        setTotalItems(data.pagination?.total || 0);
      } catch (error) {
        console.error("Failed to fetch user audit logs:", error);
        setLogs([]);
        setFilteredLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserLogs();
  }, [
    currentUserId,
    currentPage,
    itemsPerPage,
    selectedAction,
    selectedEntityType,
  ]);

  // Apply client-side search filter
  useEffect(() => {
    if (!searchTerm) {
      setFilteredLogs(logs);
      return;
    }

    const term = searchTerm.toLowerCase();
    const result = logs.filter(
      (log) =>
        log.description.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.entity_type?.toLowerCase().includes(term) ||
        log.entity_id?.toLowerCase().includes(term) ||
        (log.notes && log.notes.toLowerCase().includes(term))
    );

    setFilteredLogs(result);
  }, [logs, searchTerm]);

  // Sort logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (aValue === undefined || bValue === undefined) return 0;
    if (aValue < bValue) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  // Pagination logic - now handled server-side
  const currentItems = sortedLogs;

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const requestSort = (key: keyof AuditLog) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getActionColor = (action: string) => {
    if (action.includes("LOGIN")) return "bg-blue-100 text-blue-800";
    if (action.includes("SETUP")) return "bg-green-100 text-green-800";
    if (action.includes("REQUEST_CREATED"))
      return "bg-yellow-100 text-yellow-800";
    if (action.includes("APPROVED")) return "bg-green-100 text-green-800";
    if (action.includes("DENIED")) return "bg-red-100 text-red-800";
    if (action.includes("TRANSFER")) return "bg-purple-100 text-purple-800";
    if (action.includes("RECEIVE")) return "bg-teal-100 text-teal-800";
    if (action.includes("INVENTORY")) return "bg-indigo-100 text-indigo-800";
    if (action.includes("PRODUCT")) return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  const getActionIcon = (action: string) => {
    if (action.includes("LOGIN")) return <User className="w-4 h-4" />;
    if (action.includes("SETUP")) return <ChevronUp className="w-4 h-4" />;
    if (action.includes("REQUEST_CREATED"))
      return <Package className="w-4 h-4" />;
    if (action.includes("APPROVED"))
      return <CheckCircle2 className="w-4 h-4" />;
    if (action.includes("DENIED")) return <XCircle className="w-4 h-4" />;
    if (action.includes("TRANSFER")) return <Building className="w-4 h-4" />;
    if (action.includes("RECEIVE")) return <Package className="w-4 h-4" />;
    if (action.includes("INVENTORY")) return <Package className="w-4 h-4" />;
    if (action.includes("PRODUCT")) return <Package className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getActionDisplayName = (action: string) => {
    const actionMap: { [key: string]: string } = {
      USER_LOGIN: "Login",
      USER_SETUP_COMPLETED: "Account Setup",
      PRODUCT_REQUEST_CREATED: "Request Created",
      PRODUCT_REQUEST_APPROVED: "Request Approved",
      PRODUCT_REQUEST_DENIED: "Request Denied",
      INVENTORY_TRANSFER: "Inventory Transfer",
      PRODUCT_ADDED: "Product Added",
      PRODUCT_UPDATED: "Product Updated",
      PRODUCT_DELETED: "Product Deleted",
      USER_CREATED: "User Created",
      USER_UPDATED: "User Updated",
      BRANCH_CREATED: "Branch Created",
      BRANCH_UPDATED: "Branch Updated",
    };
    return actionMap[action] || action.replace(/_/g, " ");
  };

  const refreshLogs = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (selectedAction !== "ALL") {
        params.append("action", selectedAction);
      }
      if (selectedEntityType !== "ALL") {
        params.append("entity_type", selectedEntityType);
      }

      const response = await fetch(
        `http://localhost:5000/api/audit-logs/user/${currentUserId}?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user audit logs");
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setFilteredLogs(data.logs || []);
      setTotalPages(data.pagination?.pages || 0);
      setTotalItems(data.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to refresh user audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);

      if (currentPage <= halfVisible) {
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - halfVisible) {
        startPage = totalPages - maxVisiblePages + 1;
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (startPage > 1) {
        if (startPage > 2) {
          pageNumbers.unshift(-1); // Ellipsis indicator
        }
        pageNumbers.unshift(1);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(-1); // Ellipsis indicator
        }
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  if (!currentUserId) {
    return (
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "ml-5" : "ml-1"
        } p-2 sm:p-4`}
      >
        <div className="container mx-auto px-4 py-6 bg-white rounded-lg mb-3.5 shadow-md">
          <div className="text-center py-12">
            <p className="text-gray-500">
              Unable to load user information. Please try logging out and
              logging back in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="container mx-auto px-4 py-6 rounded-lg mb-3.5 shadow-md bg-white dark:bg-gray-900 transition-colors">
        {/* Header */}
        <div className="flex justify-between items-center ">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center cursor-pointer text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={24} className="mr-1" />
              </button>
              <h5 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Clock className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                My Activity Log
              </h5>
            </div>
            <p className="text-base text-gray-600 dark:text-gray-400 ml-5.5 mt-1">
              Track all your actions and system interactions in real-time
            </p>
          </div>

          <div className="flex items-center space-x-6">
            {/* Items per page */}
            <div className="flex items-center">
              <label
                htmlFor="itemsPerPage"
                className="mr-3 text-base font-medium text-gray-600 dark:text-gray-400"
              >
                Items per page:
              </label>
              <select
                id="itemsPerPage"
                className="
        px-4 py-2 rounded-xl text-base font-medium
        bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
        text-gray-800 dark:text-gray-200
        shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.7)]
        dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-4px_-4px_8px_rgba(60,60,60,0.5)]
        focus:ring-2 focus:ring-blue-500 outline-none transition-all
      "
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={refreshLogs}
              disabled={isLoading}
              className="
      flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-base
      text-blue-800 dark:text-blue-500
      bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
      shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)]
      dark:shadow-[6px_6px_12px_rgba(0,0,0,0.7),-6px_-6px_12px_rgba(60,60,60,0.0)]
      hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.15),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]
      dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.85),inset_-6px_-6px_12px_rgba(70,70,70,0.7)]
      hover:scale-[1.05] active:scale-95
      transition-all duration-300 disabled:opacity-50
    "
            >
              <RefreshCw
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div
          className="mt-2.5 p-6 rounded-2xl
    bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
    shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.7)]
    dark:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(40,40,40,0.6)]
    transition-all duration-300"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search my activity..."
                className="block w-full pl-12 pr-3 py-3 rounded-xl text-base
          bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
          text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400
          shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.7)]
          dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-4px_-4px_8px_rgba(60,60,60,0.5)]
          focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Action Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Filter className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <select
                className="block w-full pl-12 pr-3 py-3 rounded-xl text-base
          bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
          text-gray-800 dark:text-gray-200
          shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.7)]
          dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-4px_-4px_8px_rgba(60,60,60,0.5)]
          focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
              >
                <option value="ALL">All Actions</option>
                <option value="USER_LOGIN">Login</option>
                <option value="USER_SETUP_COMPLETED">User Setup</option>
                <option value="PRODUCT_REQUEST_CREATED">Request Created</option>
                <option value="PRODUCT_REQUEST_APPROVED">
                  Request Approved
                </option>
                <option value="PRODUCT_REQUEST_DENIED">Request Denied</option>
              </select>
            </div>

            {/* Entity Type Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Building className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <select
                className="block w-full pl-12 pr-3 py-3 rounded-xl text-base
          bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
          text-gray-800 dark:text-gray-200
          shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.7)]
          dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-4px_-4px_8px_rgba(60,60,60,0.5)]
          focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value)}
              >
                <option value="ALL">All Entities</option>
                <option value="user">User</option>
                <option value="product_requisition">Product Request</option>
                <option value="centralized_product">Product</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="shadow overflow-hidden sm:rounded-lg mt-3.5 bg-white dark:bg-gray-900">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
            </div>
          ) : sortedLogs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-14 w-14 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Activity Found
              </h3>
              <p className="text-base text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ||
                selectedAction !== "ALL" ||
                selectedEntityType !== "ALL"
                  ? "No activity logs match your current filters. Try adjusting your search criteria."
                  : "You haven't performed any actions yet. Your activity will appear here as you use the system."}
              </p>
              {(searchTerm ||
                selectedAction !== "ALL" ||
                selectedEntityType !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedAction("ALL");
                    setSelectedEntityType("ALL");
                  }}
                  className="px-5 py-2.5 rounded-2xl 
            shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] 
            dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] 
            bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 
            font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-base">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("timestamp")}
                      >
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 mr-2" />
                          Date & Time
                          {sortConfig.key === "timestamp" &&
                            (sortConfig.direction === "ascending" ? (
                              <ChevronUp className="w-5 h-5 ml-1" />
                            ) : (
                              <ChevronDown className="w-5 h-5 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("action")}
                      >
                        <div className="flex items-center">
                          <Filter className="w-5 h-5 mr-2" />
                          Action
                          {sortConfig.key === "action" &&
                            (sortConfig.direction === "ascending" ? (
                              <ChevronUp className="w-5 h-5 ml-1" />
                            ) : (
                              <ChevronDown className="w-5 h-5 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Entity
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentItems.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base text-gray-900 dark:text-gray-100">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-base text-gray-500 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-xl 
                      shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] 
                      dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.05)] 
                      backdrop-blur-sm ${getActionColor(log.action)}`}
                          >
                            <div className="flex items-center">
                              {getActionIcon(log.action)}
                              <span className="ml-2">
                                {getActionDisplayName(log.action)}
                              </span>
                            </div>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-base font-medium text-gray-900 dark:text-gray-100 max-w-xs">
                            {log.description}
                          </div>
                          {log.notes && (
                            <div className="text-base text-gray-500 dark:text-gray-400">
                              Note: {log.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-base text-gray-900 dark:text-gray-100">
                            <span className="font-medium">Type:</span>{" "}
                            {log.entity_type || "—"}
                          </div>
                          <div className="text-base text-gray-500 dark:text-gray-400">
                            <span className="font-medium">ID:</span>{" "}
                            {log.entity_id || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-base text-gray-500 dark:text-gray-400 max-w-xs">
                            {log.metadata &&
                            Object.keys(log.metadata).length > 0 ? (
                              <button
                                className="inline-flex items-center px-4 py-2 rounded-2xl 
                          shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] 
                          dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.0)] 
                          bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-500 
                          font-bold hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                                onClick={() =>
                                  navigate("/user-audit-log-details")
                                }
                                type="button"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </button>
                            ) : (
                              "—"
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl 
              shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] 
              dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] 
              bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 
              font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      paginate(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl 
              shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] 
              dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] 
              bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 
              font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                {/* Desktop Pagination */}
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base text-gray-700 dark:text-gray-200">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalItems)}
                      </span>{" "}
                      of <span className="font-medium">{totalItems}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md"
                      aria-label="Pagination"
                    >
                      {getPageNumbers().map((number, index) =>
                        number === -1 ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-4 py-2 text-gray-500 dark:text-gray-400"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`px-4 py-2 mx-1 rounded-xl font-semibold transition-all duration-300 ${
                              currentPage === number
                                ? "bg-blue-500 text-white shadow-lg"
                                : "shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:scale-[1.05]"
                            }`}
                          >
                            {number}
                          </button>
                        )
                      )}
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAuditLogsPage;
