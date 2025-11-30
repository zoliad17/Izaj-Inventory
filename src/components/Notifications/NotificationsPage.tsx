import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Building,
  AlertCircle,
  ArrowLeft,
  Search,
  Filter,
} from "lucide-react";
// import { useSidebar } from "../Sidebar/SidebarContext";

// Define the type for our notification items
interface NotificationItem {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  message: string;
  time: string;
  type: string; // Added for filtering
}

// Define types for filter options
type NotificationType = "all" | "product" | "transfer" | "alert";

function NotificationsPage() {
  // const { isCollapsed } = useSidebar();
  const navigate = useNavigate();

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<NotificationType>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Static notification data with proper typing
  const notifications: NotificationItem[] = [
    {
      id: 1,
      icon: Package,
      iconBgClass: "bg-blue-100 dark:bg-blue-900/30",
      iconColorClass: "text-blue-600 dark:text-blue-400",
      title: "New product request approved",
      message: "Your request for 50 LED Bulbs has been approved",
      time: "2 hours ago",
      type: "product",
    },
    {
      id: 2,
      icon: Building,
      iconBgClass: "bg-green-100 dark:bg-green-900/30",
      iconColorClass: "text-green-600 dark:text-green-400",
      title: "Stock transfer completed",
      message: "200 units transferred to Main Branch",
      time: "Yesterday",
      type: "transfer",
    },
    {
      id: 3,
      icon: AlertCircle,
      iconBgClass: "bg-amber-100 dark:bg-amber-900/30",
      iconColorClass: "text-amber-600 dark:text-amber-400",
      title: "Low stock alert",
      message: "LED Bulbs stock is running low (15 units remaining)",
      time: "2 days ago",
      type: "alert",
    },
    {
      id: 4,
      icon: Package,
      iconBgClass: "bg-blue-100 dark:bg-blue-900/30",
      iconColorClass: "text-blue-600 dark:text-blue-400",
      title: "New shipment received",
      message: "500 units of Smart Bulbs have arrived at your branch",
      time: "3 days ago",
      type: "product",
    },
    {
      id: 5,
      icon: AlertCircle,
      iconBgClass: "bg-red-100 dark:bg-red-900/30",
      iconColorClass: "text-red-600 dark:text-red-400",
      title: "Critical stock level",
      message: "Motion Sensor Lights are out of stock",
      time: "1 week ago",
      type: "alert",
    },
    {
      id: 6,
      icon: Building,
      iconBgClass: "bg-green-100 dark:bg-green-900/30",
      iconColorClass: "text-green-600 dark:text-green-400",
      title: "Branch transfer initiated",
      message: "150 units scheduled for transfer to East Branch",
      time: "1 week ago",
      type: "transfer",
    },
    {
      id: 7,
      icon: Package,
      iconBgClass: "bg-blue-100 dark:bg-blue-900/30",
      iconColorClass: "text-blue-600 dark:text-blue-400",
      title: "Product restock ordered",
      message: "Purchase order #1234 created for 300 LED Bulbs",
      time: "10 days ago",
      type: "product",
    },
    {
      id: 8,
      icon: AlertCircle,
      iconBgClass: "bg-amber-100 dark:bg-amber-900/30",
      iconColorClass: "text-amber-600 dark:text-amber-400",
      title: "Inventory adjustment required",
      message: "Discrepancy detected in Motion Sensor Lights count",
      time: "12 days ago",
      type: "alert",
    },
  ];

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesSearch =
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterType === "all" || notification.type === filterType;

      return matchesSearch && matchesFilter;
    });
  }, [notifications, searchTerm, filterType]);

  // Pagination logic
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  return (
    <div className="transition-all duration-300 flex flex-col h-full p-4 sm:p-6 dark:bg-gray-900/70 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mr-4"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notifications
        </h1>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search notifications..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none dark:text-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as NotificationType)}
          >
            <option value="all">All Types</option>
            <option value="product">Product</option>
            <option value="transfer">Transfer</option>
            <option value="alert">Alert</option>
          </select>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {paginatedNotifications.length} of{" "}
        {filteredNotifications.length} notifications
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {paginatedNotifications.length > 0 ? (
          paginatedNotifications.map((notification) => (
            <div
              key={notification.id}
              className="p-5 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notification.iconBgClass}`}
                >
                  <notification.icon
                    className={`w-5 h-5 ${notification.iconColorClass}`}
                  />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {notification.title}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 capitalize">
                      {notification.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {notification.time}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No notifications found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm rounded-lg ${
                currentPage === 1
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm rounded-lg ${
                currentPage === totalPages
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
