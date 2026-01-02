import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Building,
  AlertCircle,
  ArrowLeft,
  Search,
  Filter,
  Trash2,
  Loader,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import { API_BASE_URL } from "../../config/config";
// import { useSidebar } from "../Sidebar/SidebarContext";

// Define the type for our notification items
interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  link?: string;
  type?: string;
  read?: boolean;
  metadata?: any;
  created_at?: string;
}

// Define types for filter options
type NotificationType =
  | "all"
  | "product"
  | "transfer"
  | "alert"
  | "product_request"
  | "general";

// Map notification types to icon components
const getNotificationIcon = (type?: string) => {
  switch (type) {
    case "product":
    case "product_request":
      return Package;
    case "transfer":
      return Building;
    case "alert":
    case "low_stock":
      return AlertCircle;
    default:
      return AlertCircle;
  }
};

// Define badge styles for each notification type
const getTypeBadgeClass = (type?: string) => {
  switch (type) {
    case "product":
    case "product_request":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "transfer":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "alert":
    case "low_stock":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
};

// Format time to relative format
const formatTime = (dateString?: string) => {
  if (!dateString) return "Just now";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

function NotificationsPage() {
  // const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Get notifications from backend hook
  const { notifications, isLoading, markRead, markAllRead } = useNotifications({
    userId: currentUser?.user_id || null,
    enabled: true,
  });

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<NotificationType>("all");
  const [localNotifications, setLocalNotifications] = useState<
    NotificationItem[]
  >([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Update local notifications when hook data changes
  useEffect(() => {
    if (notifications && Array.isArray(notifications)) {
      setLocalNotifications(
        (notifications as NotificationItem[]).map((n) => ({
          ...n,
          title: n.title || "",
        }))
      );
    }
  }, [notifications]);

  // Handle delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        // Remove from local state
        setLocalNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
      } else {
        console.error("Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    await markRead([notificationId]);
    // Update local state
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllRead();
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    return localNotifications.filter((notification) => {
      const matchesSearch =
        (notification.title?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (notification.message?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        );

      const notificationType = notification.type || "general";
      const matchesFilter =
        filterType === "all" || notificationType === filterType;

      return matchesSearch && matchesFilter;
    });
  }, [localNotifications, searchTerm, filterType]);

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
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
            <option value="product_request">Product Request</option>
            <option value="transfer">Transfer</option>
            <option value="alert">Alert</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {/* Results Info & Mark All Read Button */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-base text-gray-600 dark:text-gray-400">
          Showing {paginatedNotifications.length} of{" "}
          {filteredNotifications.length} notifications
        </div>
        {filteredNotifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : paginatedNotifications.length > 0 ? (
          paginatedNotifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.type);
            const isUnread = !notification.read;

            return (
              <div
                key={notification.id}
                className={`p-5 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                  isUnread
                    ? "bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 pt-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.type === "product" ||
                        notification.type === "product_request"
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : notification.type === "transfer"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-amber-100 dark:bg-amber-900/30"
                      }`}
                    >
                      <IconComponent
                        className={`w-5 h-5 ${
                          notification.type === "product" ||
                          notification.type === "product_request"
                            ? "text-blue-600 dark:text-blue-400"
                            : notification.type === "transfer"
                            ? "text-green-600 dark:text-green-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      />
                    </div>
                  </div>
                  <div className="ml-2 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                          {isUnread && (
                            <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </h3>
                        {notification.message && (
                          <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      <span
                        className={`text-sm px-2 py-1 rounded-full font-medium capitalize whitespace-nowrap ml-2 ${getTypeBadgeClass(
                          notification.type
                        )}`}
                      >
                        {notification.type || "general"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex gap-2 text-sm">
                      {isUnread && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                      {notification.link && (
                        <button
                          onClick={() => navigate(notification.link || "/")}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer"
                        >
                          View
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDeleteNotification(notification.id)
                        }
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium ml-auto cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No notifications found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-base text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-base rounded-lg ${
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
              className={`px-4 py-2 text-base rounded-lg ${
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
