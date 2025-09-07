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

        const response = await fetch(`http://localhost:5000/api/audit-logs?${params}`);
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
  }, [currentPage, itemsPerPage, selectedAction, selectedUser, selectedEntityType]);

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
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
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
    if (action.includes("LOGIN")) return "bg-blue-100 text-blue-800";
    if (action.includes("SETUP")) return "bg-green-100 text-green-800";
    if (action.includes("REQUEST_CREATED")) return "bg-yellow-100 text-yellow-800";
    if (action.includes("APPROVED")) return "bg-green-100 text-green-800";
    if (action.includes("DENIED")) return "bg-red-100 text-red-800";
    if (action.includes("TRANSFER")) return "bg-purple-100 text-purple-800";
    if (action.includes("RECEIVE")) return "bg-teal-100 text-teal-800";
    return "bg-gray-100 text-gray-800";
  };

  const getActionIcon = (action: string) => {
    if (action.includes("LOGIN")) return <User className="w-4 h-4" />;
    if (action.includes("SETUP")) return <ChevronUp className="w-4 h-4" />;
    if (action.includes("REQUEST_CREATED")) return <Package className="w-4 h-4" />;
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

      const response = await fetch(`http://localhost:5000/api/audit-logs?${params}`);
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
      className={`transition-all duration-300 ${isCollapsed ? "ml-5" : "ml-1"
        } p-2 sm:p-4`}
    >
      <div className="container mx-auto px-4 py-6 bg-white rounded-lg mb-3.5 shadow-md">
        {/* Header */}
        <div className="flex justify-between items-center ">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center cursor-pointer text-gray-800 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} className="mr-1" />
              </button>
              <h5 className="text-2xl font-bold text-gray-800">Audit Logs</h5>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <label
                htmlFor="itemsPerPage"
                className="mr-2 text-sm text-gray-600"
              >
                Items per page:
              </label>
              <select
                id="itemsPerPage"
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
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
            <button
              onClick={refreshLogs}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white mt-2.5 p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search logs..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Action Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
              >
                <option value="ALL">All Actions</option>
                <option value="USER_LOGIN">Login</option>
                <option value="USER_SETUP_COMPLETED">User Setup</option>
                <option value="PRODUCT_REQUEST_CREATED">Request Created</option>
                <option value="PRODUCT_REQUEST_APPROVED">Request Approved</option>
                <option value="PRODUCT_REQUEST_DENIED">Request Denied</option>
              </select>
            </div>

            {/* User Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="ALL">All Users</option>
                {/* This would be populated from a users API call */}
              </select>
            </div>

            {/* Entity Type Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-3.5">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : sortedLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("timestamp")}
                      >
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Date & Time
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("action")}
                      >
                        <div className="flex items-center">
                          <Filter className="w-4 h-4 mr-2" />
                          Action
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Entity
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("user")}
                      >
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          User
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(
                              log.action
                            )}`}
                          >
                            <div className="flex items-center">
                              {getActionIcon(log.action)}
                              <span className="ml-1">{log.action.replace(/_/g, ' ')}</span>
                            </div>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs">
                            {log.description}
                          </div>
                          {log.notes && (
                            <div className="text-sm text-gray-500">
                              Note: {log.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">Type:</span> {log.entity_type || "—"}
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">ID:</span> {log.entity_id || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {log.user?.name || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {log.user?.email || log.user_id}
                          </div>
                          {log.user?.role?.role_name && (
                            <div className="text-xs text-blue-600">
                              {log.user.role.role_name}
                            </div>
                          )}
                          {log.user?.branch?.location && (
                            <div className="text-xs text-gray-500">
                              {log.user.branch.location}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {/* Severity Badge */}
                            {log.severity_level && (
                              <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(log.severity_level)}`}>
                                {getSeverityIcon(log.severity_level)}
                                <span className="ml-1">{log.severity_level}</span>
                              </div>
                            )}

                            {/* Action Category */}
                            {log.action_category && (
                              <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                {log.action_category}
                              </div>
                            )}

                            {/* View Details Button */}
                            <button
                              onClick={() => handleViewDetails(log)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <Eye className="w-3 h-3 mr-1" />
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
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      paginate(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {((currentPage - 1) * itemsPerPage) + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalItems)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">{totalItems}</span>{" "}
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
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">First</span>
                        <ChevronsLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      {getPageNumbers().map((number, index) =>
                        number === -1 ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === number
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
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
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => paginate(totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <AuditLogDetailView
          log={selectedLog}
          onClose={handleCloseDetailView}
        />
      )}
    </div>
  );
};

export default AuditLogsPage;
