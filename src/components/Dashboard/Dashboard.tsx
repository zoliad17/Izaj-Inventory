import { useSidebar } from "../Sidebar/SidebarContext";
import { createPortal } from "react-dom";

import {
  Package,
  Lightbulb,
  AlertCircle,
  Clock,
  Plus,
  RefreshCw,
  // TrendingUp,
  // ClipboardList,
  // ArrowRight,
  User,
  Building,
  Group,
  Bell,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { useAuth } from "../../contexts/AuthContext";
import { useRole } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/config";
import CategoryListModal from "./CategoryListModal";
import { CustomBarChart } from "./CustomBarChart";
import {
  useNotifications,
  NotificationItem,
} from "../../hooks/useNotifications";

// Types for analytics data
interface TopProduct {
  product_id?: number;
  product_name: string;
  total_sold: number;
  avg_daily: number;
  transaction_count: number;
}

interface RestockRecommendation {
  product_id?: number;
  product_name: string;
  last_sold_qty: number;
  daily_rate: number;
  recommendation: string;
  priority: "high" | "medium" | "low";
}

interface Branch {
  id: number;
  location: string;
}

// shadcn
import * as React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

function Dashboard() {
  const { isCollapsed } = useSidebar();

  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { isSuperAdmin, isBranchManager, isAdmin } = useRole(); // Use the hook

  // Get user role from context (more reliable than localStorage)
  // const userRole = currentUser?.role_name || localStorage.getItem("userRole");
  // const isSuperAdmin = userRole === "Super Admin";
  // const isBranchManager = userRole === "Branch Manager" || isSuperAdmin;
  // const isAdmin = userRole === "Admin" || isBranchManager;

  // State for analytics data - must be declared before hooks that use them
  const [topProducts, setTopProducts] = React.useState<TopProduct[]>([]);
  const [restockRecommendations, setRestockRecommendations] = React.useState<
    RestockRecommendation[]
  >([]);
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [timeRange, setTimeRange] = React.useState("30d");
  const [selectedBranch, setSelectedBranch] = React.useState<string | null>(
    null
  );
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [analyticsServerAvailable, setAnalyticsServerAvailable] =
    React.useState<boolean | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);

  // State for notification panel
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] =
    React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Close notification panel when scrolling
  React.useEffect(() => {
    const handleScroll = () => {
      if (isNotificationPanelOpen) {
        setIsNotificationPanelOpen(false);
      }
    };

    // Add scroll event listener to window
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      // Clean up event listener
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isNotificationPanelOpen]);

  // Fetch dashboard statistics
  const { stats, isLoading, error, refetch } = useDashboardStats({
    branchId: isSuperAdmin()
      ? selectedBranch || undefined
      : currentUser?.branch_id || undefined,
    refreshInterval: 300000, // Refresh every 5 minutes (300 seconds)
    enabled: true,
  });

  // Fetch notifications for the current user (only when user is logged in)
  const {
    unreadCount,
    notifications,
    isLoading: isNotificationsLoading,
    markRead,
  } = useNotifications({
    pollInterval: 30000, // Poll every 30 seconds
    enabled: !!currentUser?.user_id, // Only enable when user is logged in
    userId: currentUser?.user_id || null,
    realtime: true,
  });

  // Fetch pending requests count for Branch Manager and Admin (currently unused)
  // const {
  //   count: pendingRequestsCount,
  //   isLoading: isPendingLoading,
  //   error: pendingError,
  // } = usePendingRequestsCount({
  //   userId: currentUser?.user_id,
  //   refreshInterval: 300000, // Refresh every 5 minutes
  //   enabled: isAdmin(),
  // });

  const PYTHON_BACKEND_URL =
    import.meta.env.VITE_PYTHON_BACKEND_URL || "http://localhost:5001";

  // Fetch branches for Super Admin
  const fetchBranches = React.useCallback(async () => {
    if (!isSuperAdmin()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/branches`);
      if (!response.ok) throw new Error("Failed to fetch branches");
      const data = await response.json();
      setBranches(data || []);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  }, [isSuperAdmin]);

  // Fetch top products with branch filtering
  const fetchTopProducts = React.useCallback(async () => {
    try {
      const days = timeRange === "7d" ? 7 : timeRange === "90d" ? 90 : 30;
      const branchId = isSuperAdmin() ? selectedBranch : currentUser?.branch_id;
      const params = new URLSearchParams({
        days: days.toString(),
        limit: "10",
      });
      if (branchId) {
        params.append("branch_id", branchId.toString());
      }

      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/analytics/top-products?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch top products");
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setTopProducts(result.data);
        setAnalyticsServerAvailable(true);
      }
    } catch (err: any) {
      // Check if it's a connection error
      const isConnectionError =
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("ERR_CONNECTION_REFUSED") ||
        err?.name === "TypeError";

      if (isConnectionError) {
        setAnalyticsServerAvailable(false);
        // Only log once per session to reduce console noise
        if (analyticsServerAvailable === null) {
          console.warn(
            "Analytics server is not available. Please start the Python analytics server on port 5001."
          );
        }
      } else {
        console.error("Error fetching top products:", err);
      }
    }
  }, [
    timeRange,
    isSuperAdmin,
    selectedBranch,
    currentUser?.branch_id,
    PYTHON_BACKEND_URL,
    analyticsServerAvailable,
  ]);

  // Fetch inventory analytics (restock recommendations)
  const fetchRestockRecommendations = React.useCallback(async () => {
    try {
      const days = timeRange === "7d" ? 7 : timeRange === "90d" ? 90 : 30;
      const branchId = isSuperAdmin() ? selectedBranch : currentUser?.branch_id;
      const params = new URLSearchParams({
        days: days.toString(),
        limit: "10",
      });
      if (branchId) {
        params.append("branch_id", branchId.toString());
      }

      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/analytics/inventory-analytics?${params}`
      );
      if (!response.ok)
        throw new Error("Failed to fetch restock recommendations");
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        // Convert inventory analytics to restock recommendations format
        const recommendations = result.data
          .filter((item: any) => item.stockout_risk_percentage > 5)
          .map((item: any) => ({
            product_id: item.product_id,
            product_name: item.product_name || `Product ${item.product_id}`,
            last_sold_qty: item.current_stock,
            daily_rate: item.avg_daily_usage,
            recommendation: item.recommendation,
            priority:
              item.stockout_risk_percentage > 20
                ? "high"
                : item.stockout_risk_percentage > 10
                ? "medium"
                : "low",
          }));
        setRestockRecommendations(recommendations);
        setAnalyticsServerAvailable(true);
      }
    } catch (err: any) {
      // Check if it's a connection error
      const isConnectionError =
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("ERR_CONNECTION_REFUSED") ||
        err?.name === "TypeError";

      if (isConnectionError) {
        setAnalyticsServerAvailable(false);
        // Don't log again if we already logged it in fetchTopProducts
      } else {
        console.error("Error fetching restock recommendations:", err);
      }
    }
  }, [
    timeRange,
    isSuperAdmin,
    selectedBranch,
    currentUser?.branch_id,
    PYTHON_BACKEND_URL,
  ]);

  // Generate chart data from top products
  const generateChartData = React.useCallback(() => {
    // Create daily chart data from top products (simulating 30 days)
    const days = 30;
    const data = Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const entry: any = { day: `Day ${day}` };

      // Distribute top products across chart
      topProducts.slice(0, 5).forEach((product, idx) => {
        const key = `product_${idx}`;
        // Create realistic variation around average
        const baseValue = Math.round((product.avg_daily * 30) / days);
        const variation = Math.round(baseValue * (0.3 + Math.random() * 0.4));
        entry[key] = Math.max(0, baseValue + variation);
      });

      return entry;
    });

    setChartData(data);
  }, [topProducts]);

  // Fetch all analytics data
  const fetchAnalyticsData = React.useCallback(async () => {
    try {
      await Promise.all([fetchTopProducts(), fetchRestockRecommendations()]);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
    }
  }, [fetchTopProducts, fetchRestockRecommendations]);

  // Generate chart data when top products change
  React.useEffect(() => {
    generateChartData();
  }, [generateChartData]);

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string | undefined): string => {
    if (!dateString) return "Unknown time";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    }
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  };

  // Helper function to get icon and styling based on notification type
  const getNotificationIcon = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case "product":
        return {
          icon: Package,
          bgClass: "bg-blue-100 dark:bg-blue-900/30",
          colorClass: "text-blue-600 dark:text-blue-400",
        };
      case "transfer":
        return {
          icon: Building,
          bgClass: "bg-green-100 dark:bg-green-900/30",
          colorClass: "text-green-600 dark:text-green-400",
        };
      case "alert":
        return {
          icon: AlertCircle,
          bgClass: "bg-amber-100 dark:bg-amber-900/30",
          colorClass: "text-amber-600 dark:text-amber-400",
        };
      default:
        return {
          icon: Bell,
          bgClass: "bg-gray-100 dark:bg-gray-900/30",
          colorClass: "text-gray-600 dark:text-gray-400",
        };
    }
  };

  // Handle notification click - navigate and mark as read
  const handleNotificationClick = async (notification: NotificationItem) => {
    // Mark as read if unread
    if (!notification.read) {
      // If link exists, mark by link (more reliable with backend)
      // Otherwise mark by ID (local state update)
      if (notification.link) {
        await markRead(undefined, notification.link);
      } else if (notification.id) {
        await markRead([notification.id]);
      }
    }

    // Navigate to the link if provided
    if (notification.link) {
      navigate(notification.link);
      setIsNotificationPanelOpen(false);
    }
  };

  // Fetch branches for Super Admin on mount
  React.useEffect(() => {
    if (isSuperAdmin()) {
      fetchBranches();
    }
  }, [isSuperAdmin, fetchBranches]);

  // Fetch analytics data on mount and when user/timeRange/selectedBranch changes
  React.useEffect(() => {
    if (currentUser) {
      fetchAnalyticsData();
    }
  }, [currentUser, timeRange, selectedBranch, fetchAnalyticsData]);

  // Generate dynamic chart config from top products
  const dynamicChartConfig = React.useMemo(() => {
    const config: any = {
      visitors: {
        label: "Visitors",
      },
    };

    // Add configuration for each of the top products (up to 5)
    const colors = [
      "hsl(12, 76%, 61%)", // red-orange
      "hsl(173, 58%, 39%)", // teal
      "hsl(217, 91%, 60%)", // blue
      "hsl(280, 85%, 67%)", // purple
      "hsl(48, 96%, 53%)", // yellow
    ];

    topProducts.slice(0, 5).forEach((product, idx) => {
      const key = `product_${idx}`;
      config[key] = {
        label: product.product_name.substring(0, 20),
        color: colors[idx],
      };
    });

    return config;
  }, [topProducts]);

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 dark:bg-gray-900/70 min-h-screen `}
    >
      <div className="mt-2 mb-8">
        {/* Welcome Message */}

        <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md p-6 mb-8 relative">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {currentUser?.name || "User"} 👋
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Here's a quick overview of your dashboard today.
              </p>
            </div>
            {/* Notification Icon with Badge */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() =>
                  setIsNotificationPanelOpen(!isNotificationPanelOpen)
                }
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {/* Badge Indicator - Dynamic unread count */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {/* Notification Popover Panel */}
              {isNotificationPanelOpen &&
                createPortal(
                  <div className="fixed top-14 right-20 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-[9999]">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          Notifications
                        </h3>
                        <button
                          onClick={() => setIsNotificationPanelOpen(false)}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {/* Dynamic Notification Items */}
                      {isNotificationsLoading ? (
                        <div className="p-8 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Loading notifications...
                          </p>
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.slice(0, 10).map((notification) => {
                          const iconConfig = getNotificationIcon(
                            notification.type
                          );
                          const IconComponent = iconConfig.icon;
                          const isUnread = !notification.read;

                          return (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                                isUnread
                                  ? "bg-blue-50/50 dark:bg-blue-900/10"
                                  : ""
                              }`}
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                            >
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                  <div
                                    className={`w-8 h-8 rounded-full ${iconConfig.bgClass} flex items-center justify-center`}
                                  >
                                    <IconComponent
                                      className={`w-4 h-4 ${iconConfig.colorClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="ml-3 flex-1">
                                  <div className="flex items-start justify-between">
                                    <p
                                      className={`text-sm font-medium ${
                                        isUnread
                                          ? "text-blue-700 dark:text-blue-300 font-semibold"
                                          : "text-gray-600 dark:text-gray-400"
                                      }`}
                                    >
                                      {notification.title || "Notification"}
                                    </p>
                                    {isUnread && (
                                      <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {notification.message || "No message"}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {formatTimeAgo(notification.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No notifications available
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Footer with View All button */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
                      <button
                        onClick={() => navigate("/notifications")}
                        className="w-full py-2 cursor-pointer text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
                      >
                        View All Notifications
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
            </div>
          </div>
        </div>

        {isSuperAdmin() ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Branches Card */}
            <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-tr from-purple-500/20 to-purple-700/20 dark:from-purple-800/30 dark:to-purple-600/30">
                    <Building
                      className="text-purple-600 dark:text-purple-400"
                      size={22}
                    />
                  </div>
                  <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100">
                    Branches
                  </h5>
                </div>
                {isLoading && (
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                {isLoading
                  ? "..."
                  : error
                  ? "Error"
                  : stats?.totalBranches || "0"}
              </h6>
              <p className="text-sm text-gray-500 mt-1">Total Branches</p>
              {error && (
                <p className="text-sm text-red-500 mt-2">Failed to load data</p>
              )}
            </div>

            {/* Users Card */}
            <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-indigo-700/20 dark:from-indigo-800/30 dark:to-indigo-600/30">
                  <User
                    className="text-indigo-600 dark:text-indigo-400"
                    size={22}
                  />
                </div>
                <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100">
                  Users
                </h5>
                {isLoading && (
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                {isLoading ? "..." : error ? "Error" : stats?.totalUsers || "0"}
              </h6>
              <p className="text-sm text-gray-500 mt-1">
                Total registered users
              </p>
            </div>

            {/* All Products Card */}
            <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-tr from-blue-500/20 to-blue-700/20 dark:from-blue-800/30 dark:to-blue-600/30">
                    <Lightbulb
                      className="text-blue-600 dark:text-blue-400"
                      size={22}
                    />
                  </div>
                  <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100">
                    All Products
                  </h5>
                </div>
                {isLoading && (
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                {isLoading
                  ? "..."
                  : error
                  ? "Error"
                  : stats?.totalProducts || "0"}
              </h6>
              <p className="text-sm text-gray-500 mt-1">
                Total centralized products
              </p>
              {error && (
                <p className="text-sm text-red-500 mt-2">Failed to load data</p>
              )}
            </div>

            {/* Categories Card - Super Admin Only */}
            <div
              onClick={() => setIsCategoryModalOpen(true)}
              className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-tr from-green-500/20 to-green-700/20 dark:from-green-800/30 dark:to-green-600/30">
                    <Group
                      className="text-green-600 dark:text-green-400"
                      size={22}
                    />
                  </div>
                  <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100">
                    Categories
                  </h5>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/categories/add");
                    }}
                    className="p-2 rounded-full bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                    title="Add Category"
                  >
                    <Plus
                      className="text-green-600 dark:text-green-400"
                      size={16}
                    />
                  </button>
                </div>
              </div>
              <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                {isLoading
                  ? "..."
                  : error
                  ? "Error"
                  : stats?.totalCategories || "0"}
              </h6>
              <p className="text-sm text-gray-500 mt-1">
                Total product categories
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Row 1: Total Stock / Products / Pending Requests */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isBranchManager() && (
                <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-700/20 dark:from-amber-800/30 dark:to-amber-600/30">
                        <Package
                          className="text-amber-600 dark:text-amber-400"
                          size={22}
                        />
                      </div>
                      <h4 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100">
                        Total Stock
                      </h4>
                    </div>
                    {isLoading && (
                      <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                    )}
                  </div>
                  <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                    {isLoading
                      ? "..."
                      : error
                      ? "Error"
                      : stats?.totalStock?.toLocaleString() || "0"}
                  </h6>
                  <p className="text-sm text-gray-500 mt-1">
                    Total items in inventory
                  </p>
                </div>
              )}

              {isBranchManager() && (
                <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-tr from-blue-500/20 to-blue-700/20 dark:from-blue-800/30 dark:to-blue-600/30">
                        <Lightbulb
                          className="text-blue-600 dark:text-blue-400"
                          size={22}
                        />
                      </div>
                      <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100">
                        Products
                      </h5>
                    </div>
                    {isLoading && (
                      <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                    )}
                  </div>
                  <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                    {isLoading
                      ? "..."
                      : error
                      ? "Error"
                      : stats?.totalProducts || "0"}
                  </h6>
                  <p className="text-sm text-gray-500 mt-1">
                    Total distinct products
                  </p>
                </div>
              )}

              {/* {isBranchManager() && (
                <div
                  onClick={() => navigate("/pending_request")}
                  className={`cursor-pointer group rounded-2xl shadow-md border p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-md ${
                    pendingRequestsCount > 0
                      ? "bg-white/80 dark:bg-gray-900/70 border-gray-200 dark:border-gray-700"
                      : "bg-gray-50 dark:bg-gray-900/60 border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-xl ${
                          pendingRequestsCount > 0
                            ? "bg-gradient-to-tr from-orange-500/20 to-orange-700/20 dark:from-orange-800/30 dark:to-orange-600/30"
                            : "bg-gray-100 dark:bg-gray-700"
                        }`}
                      >
                        <ClipboardList
                          className={`${
                            pendingRequestsCount > 0
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                          size={22}
                        />
                      </div>
                      <h5
                        className={`font-bold text-lg md:text-xl ${
                          pendingRequestsCount > 0
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        Pending Requests
                      </h5>
                    </div>
                    <ArrowRight
                      className={`w-5 h-5 transition-colors ${
                        pendingRequestsCount > 0
                          ? "text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </div>
                  <h6
                    className={`text-2xl font-bold mt-3 ${
                      pendingRequestsCount > 0
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {isPendingLoading
                      ? "..."
                      : pendingError
                      ? "Error"
                      : pendingRequestsCount || "0"}
                  </h6>
                  <p
                    className={`text-sm mt-1 ${
                      pendingRequestsCount > 0
                        ? "text-gray-500 dark:text-gray-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {pendingRequestsCount > 0
                      ? "Awaiting your review"
                      : "No pending requests"}
                  </p>
                </div>
              )} */}

              {(isAdmin() || isBranchManager()) && (
                <div
                  onClick={() => navigate("/all_stock?status=Low Stock")}
                  className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-tr from-yellow-500/20 to-yellow-700/20 dark:from-yellow-800/30 dark:to-yellow-600/30">
                      <AlertCircle
                        className="text-yellow-600 dark:text-yellow-400"
                        size={22}
                      />
                    </div>
                    <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100">
                      Low Stock
                    </h5>
                  </div>
                  <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                    {isLoading
                      ? "..."
                      : error
                      ? "Error"
                      : stats?.lowStockCount || "0"}
                  </h6>
                  <p className="text-sm text-gray-500 mt-1">
                    Products with less than 20 units
                  </p>
                </div>
              )}

              {(isAdmin() || isBranchManager()) && (
                <div
                  onClick={() => navigate("/all_stock?status=Out of Stock")}
                  className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-tr from-red-500/20 to-red-700/20 dark:from-red-800/30 dark:to-red-600/30">
                      <AlertCircle
                        className="text-red-600 dark:text-red-400"
                        size={22}
                      />
                    </div>
                    <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100">
                      Out of Stock
                    </h5>
                  </div>
                  <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                    {isLoading
                      ? "..."
                      : error
                      ? "Error"
                      : stats?.outOfStockCount || "0"}
                  </h6>
                  <p className="text-sm text-gray-500 mt-1">
                    Products with zero units
                  </p>
                </div>
              )}
            </div>

            {/* Row 2: Low Stock / Out of Stock */}
            {/* {!isSuperAdmin() && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                {(isAdmin() || isBranchManager()) && (
                  <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-tr from-yellow-500/20 to-yellow-700/20 dark:from-yellow-800/30 dark:to-yellow-600/30">
                        <AlertCircle
                          className="text-yellow-600 dark:text-yellow-400"
                          size={22}
                        />
                      </div>
                      <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100">
                        Low Stock
                      </h5>
                    </div>
                    <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                      {isLoading
                        ? "..."
                        : error
                        ? "Error"
                        : stats?.lowStockCount || "0"}
                    </h6>
                    <p className="text-sm text-gray-500 mt-1">
                      Products with less than 20 units
                    </p>
                  </div>
                )}

                {(isAdmin() || isBranchManager()) && (
                  <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-tr from-red-500/20 to-red-700/20 dark:from-red-800/30 dark:to-red-600/30">
                        <AlertCircle
                          className="text-red-600 dark:text-red-400"
                          size={22}
                        />
                      </div>
                      <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100">
                        Out of Stock
                      </h5>
                    </div>
                    <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                      {isLoading
                        ? "..."
                        : error
                        ? "Error"
                        : stats?.outOfStockCount || "0"}
                    </h6>
                    <p className="text-sm text-gray-500 mt-1">
                      Products with zero units
                    </p>
                  </div>
                )}
              </div>
            )} */}

            {/* Row 3: Recent Activity
            <div className="grid grid-cols-1 gap-6 mt-6">
              <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-tr from-blue-500/20 to-blue-700/20 dark:from-blue-800/30 dark:to-blue-600/30">
                    <TrendingUp
                      className="text-blue-600 dark:text-blue-400"
                      size={22}
                    />
                  </div>
                  <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100">
                    Recent Activity
                  </h5>
                </div>
                <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                  {isLoading
                    ? "..."
                    : error
                    ? "Error"
                    : stats?.recentActivity || "0"}
                </h6>
                <p className="text-sm text-gray-500 mt-1">
                  Actions in the last 7 days
                </p>
              </div>
            </div> */}
          </>
        )}
      </div>

      {/* Analytics Server Status Banner */}
      {analyticsServerAvailable === false && (
        <div className="mt-6 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
              size={20}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                Analytics Server Unavailable
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                The analytics server is not running. To enable analytics
                features, start the Python analytics server:
              </p>
              <code className="mt-2 block text-xs bg-yellow-100 dark:bg-yellow-900/40 px-3 py-2 rounded border border-yellow-200 dark:border-yellow-800">
                cd analytics && python -m flask --app analytics.app run --port
                5001
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Analytics Section */}
      {isSuperAdmin() && (
        <div className="mt-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard - All Branches
              </h3>
              <Select
                value={selectedBranch || "all"}
                onValueChange={(value) =>
                  setSelectedBranch(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-[250px] rounded-lg">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="rounded-lg">
                    All Branches
                  </SelectItem>
                  {branches.map((branch) => (
                    <SelectItem
                      key={branch.id}
                      value={branch.id.toString()}
                      className="rounded-lg"
                    >
                      {branch.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* bar Chart Card */}
        <Card className="lg:col-span-8 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.6)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] border border-gray-200 dark:border-gray-700 overflow-hidden">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-1 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Top 5 Products</CardTitle>
              <CardDescription>Best selling products</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-1">
            <CustomBarChart topProducts={topProducts.slice(0, 5)} />
          </CardContent>
        </Card>
        {/* Radar Chart Card */}
        <Card className="lg:col-span-4 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.6)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] border border-gray-200 dark:border-gray-700 overflow-hidden">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-1 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Product Category Performance</CardTitle>
              <CardDescription>
                Performance comparison across product categories
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-3 pt-3 pb-2">
            <ChartContainer
              config={{
                ...dynamicChartConfig,
                performance: {
                  label: "Performance",
                  color: "hsl(12, 76%, 61%)",
                },
              }}
              className="aspect-auto h-[250px] w-full"
            >
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="80%"
                data={topProducts.slice(0, 5).map((p) => ({
                  subject: p.product_name.substring(0, 15),
                  A: p.total_sold,
                  fullMark:
                    Math.max(...topProducts.map((x) => x.total_sold)) || 150,
                }))}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis />
                <Radar
                  name="Performance"
                  dataKey="A"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.6}
                  dot={{ r: 4, fill: "var(--chart-1)" }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Products Table */}

      <Card className="mt-6 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="py-4 md:px-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-700/20 dark:from-amber-800/30 dark:to-amber-600/30">
              <Lightbulb
                className="text-amber-600 dark:text-amber-400"
                size={20}
              />
            </div>
            <h5 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
              Top Products
            </h5>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50/70 dark:bg-gray-800/70">
                <tr>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                    Product Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                    Total Sold
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide hidden sm:table-cell">
                    Daily Avg
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide hidden md:table-cell">
                    Transactions
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                    Rank
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/70 dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700">
                {topProducts.length > 0 ? (
                  topProducts.map((product, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/60 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
                        {product.product_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base text-gray-700 dark:text-gray-300">
                        {product.total_sold.toFixed(0)} units
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                        {product.avg_daily.toFixed(2)} units/day
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base text-gray-600 dark:text-gray-400 hidden md:table-cell">
                        {product.transaction_count}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base">
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          #{idx + 1}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No sales data available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 md:px-6 bg-gray-50/70 dark:bg-gray-800/70 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm md:text-base text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400 dark:text-gray-500" />
            <span>
              {isLoading
                ? "Loading..."
                : error
                ? "Error loading data"
                : stats?.lastUpdated
                ? `Last updated ${new Date(
                    stats?.lastUpdated
                  ).toLocaleTimeString()}`
                : "Last updated 3 mins ago"}
            </span>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm bg-gray-200/70 dark:bg-gray-700/70 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            disabled={isLoading}
            title="Refresh data (minimum 30 seconds between requests)"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </Card>

      {/* Stock Recommendations Section */}
      {restockRecommendations.length > 0 && (
        <Card className="mt-6 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="py-4 md:px-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-red-500/20 to-red-700/20 dark:from-red-800/30 dark:to-red-600/30">
                <AlertCircle
                  className="text-red-600 dark:text-red-400"
                  size={20}
                />
              </div>
              <h5 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                Stock Recommendations
              </h5>
            </div>

            {/* Recommendations Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50/70 dark:bg-gray-800/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide hidden sm:table-cell">
                      Current Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      Daily Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                      Recommendation
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/70 dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700">
                  {restockRecommendations.map((rec, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200 font-medium">
                        {rec.product_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                        {rec.last_sold_qty}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {rec.daily_rate.toFixed(2)} units/day
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            rec.priority === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : rec.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {rec.priority.charAt(0).toUpperCase() +
                            rec.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {rec.recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Category List Modal */}
      <CategoryListModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
}

export default Dashboard;
