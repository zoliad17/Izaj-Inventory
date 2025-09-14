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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
  Eye,
  AlertTriangle,
  Info,
  CheckCircle,
  Activity,
  Download,
} from "lucide-react";
import { useSidebar } from "../Sidebar/SidebarContext";
import { useNavigate } from "react-router-dom";
import AuditLogDetailView from "./AuditLogDetailView";

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
  user_name?: string;
  user_email?: string;
  user_status?: string;
  role_name?: string;
  branch_location?: string;
  branch_address?: string;
  action_category?: string;
  severity_level?: string;
  seconds_ago?: number;
  time_period?: string;
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

const AuditLogsPage = () => {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<string>("ALL");
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

  // Detail view state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  // Fetch audit logs from API
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        });

        if (selectedAction !== "ALL") {
          params.append("action", selectedAction);
        }
        if (selectedUser !== "ALL") {
          params.append("user_id", selectedUser);
        }
        if (selectedEntityType !== "ALL") {
          params.append("entity_type", selectedEntityType);
        }

        const response = await fetch(
          `http://localhost:5000/api/audit-logs?${params}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch audit logs");
        }

        const data = await response.json();
        setLogs(data.logs || []);
        setFilteredLogs(data.logs || []);
        setTotalPages(data.pagination?.pages || 0);
        setTotalItems(data.pagination?.total || 0);
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        setLogs([]);
        setFilteredLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [
    currentPage,
    itemsPerPage,
    selectedAction,
    selectedUser,
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
        log.user?.name?.toLowerCase().includes(term) ||
        log.user?.email?.toLowerCase().includes(term) ||
        log.user_name?.toLowerCase().includes(term) ||
        log.user_email?.toLowerCase().includes(term) ||
        log.role_name?.toLowerCase().includes(term) ||
        log.branch_location?.toLowerCase().includes(term) ||
        log.action_category?.toLowerCase().includes(term) ||
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

  // Detail view functions
  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailView(true);
  };

  const handleCloseDetailView = () => {
    setShowDetailView(false);
    setSelectedLog(null);
  };

  // Get severity icon and color
  const getSeverityIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "medium":
        return <Info className="w-4 h-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700";
      case "medium":
        return "bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-800/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700";
      case "low":
        return "bg-gradient-to-r from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700";
      case "info":
        return "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700";
      default:
        return "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

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
    if (action.includes("LOGIN")) return "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700";
    if (action.includes("SETUP")) return "bg-gradient-to-r from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700";
    if (action.includes("REQUEST_CREATED"))
      return "bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-800/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700";
    if (action.includes("APPROVED")) return "bg-gradient-to-r from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700";
    if (action.includes("DENIED")) return "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700";
    if (action.includes("TRANSFER")) return "bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700";
    if (action.includes("RECEIVE")) return "bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-700";
    return "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  };

  const getActionIcon = (action: string) => {
    if (action.includes("LOGIN")) return <User className="w-4 h-4" />;
    if (action.includes("SETUP")) return <ChevronUp className="w-4 h-4" />;
    if (action.includes("REQUEST_CREATED"))
      return <Package className="w-4 h-4" />;
    if (action.includes("APPROVED")) return <ChevronUp className="w-4 h-4" />;
    if (action.includes("DENIED")) return <ChevronDown className="w-4 h-4" />;
    if (action.includes("TRANSFER")) return <Building className="w-4 h-4" />;
    if (action.includes("RECEIVE")) return <Package className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const refreshLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (selectedAction !== "ALL") {
        params.append("action", selectedAction);
      }
      if (selectedUser !== "ALL") {
        params.append("user_id", selectedUser);
      }
      if (selectedEntityType !== "ALL") {
        params.append("entity_type", selectedEntityType);
      }

      const response = await fetch(
        `http://localhost:5000/api/audit-logs?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setFilteredLogs(data.logs || []);
      setTotalPages(data.pagination?.pages || 0);
      setTotalItems(data.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to refresh audit logs:", error);
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

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="w-full px-2 sm:px-4 py-6 bg-white dark:bg-gray-800 rounded-lg mb-3.5 shadow-md dark:shadow-gray-900/30">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center cursor-pointer text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} className="mr-1" />
            </button>
            <h5 className="text-2xl font-bold text-gray-800 dark:text-white">
              Audit Logs
            </h5>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            <div className="flex items-center">
              <label
                htmlFor="itemsPerPage"
                className="mr-2 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
              >
                Items per page:
              </label>
              <select
                id="itemsPerPage"
                className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

            {/* Export Button */}
            <button
              // onClick={exportToExcel}
              className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Export to Excel"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={refreshLogs}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-700 mt-2.5 p-4 rounded-lg shadow dark:shadow-gray-900/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search - Responsive fix */}
            <div className="relative col-span-1 sm:col-span-2 lg:col-span-1 w-full min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search logs..."
                className="block w-full min-w-0 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Action Filter */}
            <div className="relative w-full min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full min-w-0 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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

            {/* User Filter */}
            <div className="relative w-full min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full min-w-0 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="ALL">All Users</option>
                {/* This would be populated from a users API call */}
              </select>
            </div>

            {/* Entity Type Filter */}
            <div className="relative w-full min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full min-w-0 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mt-3.5 w-full">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : sortedLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No audit logs found
              </p>
            </div>
          ) : (
            <>
              <div className="w-full">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="w-32 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("timestamp")}
                      >
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Date & Time</span>
                          <span className="sm:hidden">Date</span>
                          {sortConfig.key === "timestamp" &&
                            (sortConfig.direction === "ascending" ? (
                              <ChevronUp className="w-4 h-4 ml-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="w-40 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("action")}
                      >
                        <div className="flex items-center">
                          <Filter className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Action</span>
                          <span className="sm:hidden">Action</span>
                          {sortConfig.key === "action" &&
                            (sortConfig.direction === "ascending" ? (
                              <ChevronUp className="w-4 h-4 ml-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="w-48 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        <span className="hidden lg:inline">Description</span>
                        <span className="lg:hidden">Desc</span>
                      </th>
                      <th
                        scope="col"
                        className="w-32 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        <span className="hidden lg:inline">Entity</span>
                        <span className="lg:hidden">Entity</span>
                      </th>
                      <th
                        scope="col"
                        className="w-40 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("user")}
                      >
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">User</span>
                          <span className="sm:hidden">User</span>
                          {sortConfig.key === "user" &&
                            (sortConfig.direction === "ascending" ? (
                              <ChevronUp className="w-4 h-4 ml-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 ml-1" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="w-48 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        <span className="hidden lg:inline">Details</span>
                        <span className="lg:hidden">Details</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentItems.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="text-base font-medium text-gray-900 dark:text-white">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <span
                            className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-lg shadow-sm border-2 backdrop-blur-sm ${getActionColor(
                              log.action
                            )}`}
                          >
                            <div className="flex items-center">
                              {getActionIcon(log.action)}
                              <span className="ml-2 hidden sm:inline">
                                {log.action.replace(/_/g, " ")}
                              </span>
                            </div>
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="text-base font-medium text-gray-900 dark:text-white break-words">
                            {log.description}
                          </div>
                          {log.notes && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 break-words mt-1">
                              Note: {log.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="text-base text-gray-900 dark:text-white">
                            <span className="font-semibold">Type:</span>{" "}
                            {log.entity_type || "—"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span className="font-medium">ID:</span>{" "}
                            {log.entity_id || "—"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="text-base font-medium text-gray-900 dark:text-white break-words">
                            {log.user?.name || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 break-words mt-1">
                            {log.user?.email || log.user_id}
                          </div>
                          {log.user?.role?.role_name && (
                            <div className="text-sm text-blue-600 dark:text-blue-400 break-words mt-1 font-medium">
                              {log.user.role.role_name}
                            </div>
                          )}
                          {log.user?.branch?.location && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 break-words mt-1">
                              {log.user.branch.location}
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="flex flex-col space-y-2">
                            {/* Severity Badge */}
                            {log.severity_level && (
                              <div
                                className={`px-3 py-2 rounded-xl text-sm font-semibold shadow-sm border-2 backdrop-blur-sm ${getSeverityColor(
                                  log.severity_level
                                )}`}
                              >
                                <div className="flex items-center">
                                  {getSeverityIcon(log.severity_level)}
                                  <span className="ml-2 capitalize">
                                    {log.severity_level}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Action Category */}
                            {log.action_category && (
                              <div className="px-3 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-800 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700 shadow-sm backdrop-blur-sm">
                                {log.action_category}
                              </div>
                            )}

                            {/* View Details Button */}
                            <button
                              onClick={() => handleViewDetails(log)}
                              className="inline-flex items-center px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white dark:bg-gray-800 px-2 sm:px-4 lg:px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      paginate(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
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
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => paginate(1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">First</span>
                        <ChevronsLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      {getPageNumbers().map((number, index) =>
                        number === -1 ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === number
                                ? "z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-300"
                                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                            }`}
                          >
                            {number}
                          </button>
                        )
                      )}

                      <button
                        onClick={() =>
                          paginate(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => paginate(totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Last</span>
                        <ChevronsRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail View Modal */}
      {showDetailView && selectedLog && (
        <AuditLogDetailView log={selectedLog} onClose={handleCloseDetailView} />
      )}
    </div>
  );
};

export default AuditLogsPage;
