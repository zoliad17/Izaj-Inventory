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
} from "lucide-react";
import { useSidebar } from "../Sidebar/SidebarContext";
import { useNavigate } from "react-router-dom";

interface AuditLog {
  id: string;
  timestamp: Date;
  action: "REQUEST" | "APPROVE" | "REJECT" | "TRANSFER" | "RECEIVE";
  productId: string;
  productName: string;
  quantity: number;
  fromBranch: string;
  toBranch: string;
  userId: string;
  userName: string;
  notes?: string;
}

const AuditLogsPage = () => {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
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

  // Mock data - replace with your API call
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));

        const mockLogs: AuditLog[] = [
          // ... (your existing mock data)
          // Adding more items to demonstrate pagination
          {
            id: "6",
            timestamp: new Date("2023-06-09T08:20:00"),
            action: "REQUEST",
            productId: "LAMP-3045",
            productName: "LED Downlight 10W",
            quantity: 15,
            fromBranch: "Batangas",
            toBranch: "Laguna",
            userId: "user-101",
            userName: "Alex Garcia",
            notes: "For office renovation",
          },
          {
            id: "7",
            timestamp: new Date("2023-06-08T13:45:00"),
            action: "APPROVE",
            productId: "LAMP-3045",
            productName: "LED Downlight 10W",
            quantity: 15,
            fromBranch: "Batangas",
            toBranch: "Laguna",
            userId: "user-789",
            userName: "Sarah Johnson",
          },
          {
            id: "8",
            timestamp: new Date("2023-06-07T10:30:00"),
            action: "TRANSFER",
            productId: "BULB-3344",
            productName: "Smart Bulb White",
            quantity: 20,
            fromBranch: "Lucena",
            toBranch: "Laguna",
            userId: "user-123",
            userName: "Mike Brown",
          },
          {
            id: "9",
            timestamp: new Date("2023-06-06T16:20:00"),
            action: "RECEIVE",
            productId: "BULB-3344",
            productName: "Smart Bulb White",
            quantity: 20,
            fromBranch: "Lucena",
            toBranch: "Laguna",
            userId: "user-456",
            userName: "John Smith",
          },
          {
            id: "10",
            timestamp: new Date("2023-06-05T11:15:00"),
            action: "REQUEST",
            productId: "STRIP-7788",
            productName: "LED Strip 10m",
            quantity: 5,
            fromBranch: "Laguna",
            toBranch: "Batangas",
            userId: "user-101",
            userName: "Alex Garcia",
            notes: "For showroom decoration",
          },
          {
            id: "11",
            timestamp: new Date("2023-06-04T09:45:00"),
            action: "REJECT",
            productId: "STRIP-7788",
            productName: "LED Strip 10m",
            quantity: 5,
            fromBranch: "Laguna",
            toBranch: "Batangas",
            userId: "user-789",
            userName: "Sarah Johnson",
            notes: "Backordered until next week",
          },
          {
            id: "12",
            timestamp: new Date("2023-06-03T14:30:00"),
            action: "TRANSFER",
            productId: "LAMP-2034",
            productName: "LED Panel Light 60x60",
            quantity: 3,
            fromBranch: "Batangas",
            toBranch: "Lucena",
            userId: "user-123",
            userName: "Mike Brown",
          },
          {
            id: "13",
            timestamp: new Date("2023-06-02T16:50:00"),
            action: "RECEIVE",
            productId: "LAMP-2034",
            productName: "LED Panel Light 60x60",
            quantity: 3,
            fromBranch: "Batangas",
            toBranch: "Lucena",
            userId: "user-456",
            userName: "John Smith",
          },
          {
            id: "14",
            timestamp: new Date("2023-06-01T10:20:00"),
            action: "REQUEST",
            productId: "BULB-1122",
            productName: "Smart Bulb RGB",
            quantity: 8,
            fromBranch: "Lucena",
            toBranch: "Batangas",
            userId: "user-101",
            userName: "Alex Garcia",
          },
          {
            id: "15",
            timestamp: new Date("2023-05-31T15:10:00"),
            action: "APPROVE",
            productId: "BULB-1122",
            productName: "Smart Bulb RGB",
            quantity: 8,
            fromBranch: "Lucena",
            toBranch: "Batangas",
            userId: "user-789",
            userName: "Sarah Johnson",
          },
        ];

        setLogs(mockLogs);
        setFilteredLogs(mockLogs);
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...logs];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (log) =>
          log.productName.toLowerCase().includes(term) ||
          log.productId.toLowerCase().includes(term) ||
          log.userName.toLowerCase().includes(term) ||
          log.fromBranch.toLowerCase().includes(term) ||
          log.toBranch.toLowerCase().includes(term) ||
          (log.notes && log.notes.toLowerCase().includes(term))
      );
    }

    // Apply action filter
    if (selectedAction !== "ALL") {
      result = result.filter((log) => log.action === selectedAction);
    }

    // Apply branch filter
    if (selectedBranch !== "ALL") {
      result = result.filter(
        (log) =>
          log.fromBranch === selectedBranch || log.toBranch === selectedBranch
      );
    }

    setFilteredLogs(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [logs, searchTerm, selectedAction, selectedBranch]);

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

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const requestSort = (key: keyof AuditLog) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "REQUEST":
        return "bg-blue-100 text-blue-800";
      case "APPROVE":
        return "bg-green-100 text-green-800";
      case "REJECT":
        return "bg-red-100 text-red-800";
      case "TRANSFER":
        return "bg-purple-100 text-purple-800";
      case "RECEIVE":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "REQUEST":
        return <Package className="w-4 h-4" />;
      case "APPROVE":
        return <ChevronUp className="w-4 h-4" />;
      case "REJECT":
        return <ChevronDown className="w-4 h-4" />;
      case "TRANSFER":
        return <Building className="w-4 h-4" />;
      case "RECEIVE":
        return <Package className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const refreshLogs = async () => {
    setIsLoading(true);
    // In a real app, you would fetch fresh data here
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option value="REQUEST">Request</option>
                <option value="APPROVE">Approve</option>
                <option value="REJECT">Reject</option>
                <option value="TRANSFER">Transfer</option>
                <option value="RECEIVE">Receive</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="ALL">All Branches</option>
                <option value="Lucena">Lucena</option>
                <option value="Batangas">Batangas</option>
                <option value="Laguna">Laguna</option>
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
                        Product
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Branches
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort("userName")}
                      >
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          User
                          {sortConfig.key === "userName" &&
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
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {log.timestamp.toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {log.timestamp.toLocaleTimeString()}
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
                              <span className="ml-1">{log.action}</span>
                            </div>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {log.productName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {log.productId} • Qty: {log.quantity}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">From:</span>{" "}
                            {log.fromBranch}
                          </div>
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">To:</span>{" "}
                            {log.toBranch}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {log.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {log.userId}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {log.notes || "—"}
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
                        {indexOfFirstItem + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, sortedLogs.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">{sortedLogs.length}</span>{" "}
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
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === number
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
    </div>
  );
};

export default AuditLogsPage;
