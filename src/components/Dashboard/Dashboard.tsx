import { useSidebar } from "../Sidebar/SidebarContext";

import {
  Package,
  Lightbulb,
  AlertCircle,
  Clock,
  Plus,
  RefreshCw,
  TrendingUp,
  ClipboardList,
  ArrowRight,
  User,
  Building,
  Group,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { usePendingRequestsCount } from "../../hooks/usePendingRequestsCount";
import { useAuth } from "../../contexts/AuthContext";
import { useRole } from "../../contexts/AuthContext";

// Define types for the product data
interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

// shadcn
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sample chart data - in production, this should come from an API
const chartData = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-02", desktop: 97, mobile: 180 },
  { date: "2024-04-03", desktop: 167, mobile: 120 },
  { date: "2024-04-04", desktop: 242, mobile: 260 },
  { date: "2024-04-05", desktop: 373, mobile: 290 },
  { date: "2024-04-06", desktop: 301, mobile: 340 },
  { date: "2024-04-07", desktop: 245, mobile: 180 },
  { date: "2024-04-08", desktop: 409, mobile: 320 },
  { date: "2024-04-09", desktop: 59, mobile: 110 },
  { date: "2024-04-10", desktop: 261, mobile: 190 },
  { date: "2024-04-11", desktop: 327, mobile: 350 },
  { date: "2024-04-12", desktop: 292, mobile: 210 },
  { date: "2024-04-13", desktop: 342, mobile: 380 },
  { date: "2024-04-14", desktop: 137, mobile: 220 },
  { date: "2024-04-15", desktop: 120, mobile: 170 },
  { date: "2024-04-16", desktop: 138, mobile: 190 },
  { date: "2024-04-17", desktop: 446, mobile: 360 },
  { date: "2024-04-18", desktop: 364, mobile: 410 },
  { date: "2024-04-19", desktop: 243, mobile: 180 },
  { date: "2024-04-20", desktop: 89, mobile: 150 },
  { date: "2024-04-21", desktop: 137, mobile: 200 },
  { date: "2024-04-22", desktop: 224, mobile: 170 },
  { date: "2024-04-23", desktop: 138, mobile: 230 },
  { date: "2024-04-24", desktop: 387, mobile: 290 },
  { date: "2024-04-25", desktop: 215, mobile: 250 },
  { date: "2024-04-26", desktop: 75, mobile: 130 },
  { date: "2024-04-27", desktop: 383, mobile: 420 },
  { date: "2024-04-28", desktop: 122, mobile: 180 },
  { date: "2024-04-29", desktop: 315, mobile: 240 },
  { date: "2024-04-30", desktop: 454, mobile: 380 },
  { date: "2024-05-01", desktop: 165, mobile: 220 },
  { date: "2024-05-02", desktop: 293, mobile: 310 },
  { date: "2024-05-03", desktop: 247, mobile: 190 },
  { date: "2024-05-04", desktop: 385, mobile: 420 },
  { date: "2024-05-05", desktop: 481, mobile: 390 },
  { date: "2024-05-06", desktop: 498, mobile: 520 },
  { date: "2024-05-07", desktop: 388, mobile: 300 },
  { date: "2024-05-08", desktop: 149, mobile: 210 },
  { date: "2024-05-09", desktop: 227, mobile: 180 },
  { date: "2024-05-10", desktop: 293, mobile: 330 },
  { date: "2024-05-11", desktop: 335, mobile: 270 },
  { date: "2024-05-12", desktop: 197, mobile: 240 },
  { date: "2024-05-13", desktop: 197, mobile: 160 },
  { date: "2024-05-14", desktop: 448, mobile: 490 },
  { date: "2024-05-15", desktop: 473, mobile: 380 },
  { date: "2024-05-16", desktop: 338, mobile: 400 },
  { date: "2024-05-17", desktop: 499, mobile: 420 },
  { date: "2024-05-18", desktop: 315, mobile: 350 },
  { date: "2024-05-19", desktop: 235, mobile: 180 },
  { date: "2024-05-20", desktop: 177, mobile: 230 },
  { date: "2024-05-21", desktop: 82, mobile: 140 },
  { date: "2024-05-22", desktop: 81, mobile: 120 },
  { date: "2024-05-23", desktop: 252, mobile: 290 },
  { date: "2024-05-24", desktop: 294, mobile: 220 },
  { date: "2024-05-25", desktop: 201, mobile: 250 },
  { date: "2024-05-26", desktop: 213, mobile: 170 },
  { date: "2024-05-27", desktop: 420, mobile: 460 },
  { date: "2024-05-28", desktop: 233, mobile: 190 },
  { date: "2024-05-29", desktop: 78, mobile: 130 },
  { date: "2024-05-30", desktop: 340, mobile: 280 },
  { date: "2024-05-31", desktop: 178, mobile: 230 },
  { date: "2024-06-01", desktop: 178, mobile: 200 },
  { date: "2024-06-02", desktop: 470, mobile: 410 },
  { date: "2024-06-03", desktop: 103, mobile: 160 },
  { date: "2024-06-04", desktop: 439, mobile: 380 },
  { date: "2024-06-05", desktop: 88, mobile: 140 },
  { date: "2024-06-06", desktop: 294, mobile: 250 },
  { date: "2024-06-07", desktop: 323, mobile: 370 },
  { date: "2024-06-08", desktop: 385, mobile: 320 },
  { date: "2024-06-09", desktop: 438, mobile: 480 },
  { date: "2024-06-10", desktop: 155, mobile: 200 },
  { date: "2024-06-11", desktop: 92, mobile: 150 },
  { date: "2024-06-12", desktop: 492, mobile: 420 },
  { date: "2024-06-13", desktop: 81, mobile: 130 },
  { date: "2024-06-14", desktop: 426, mobile: 380 },
  { date: "2024-06-15", desktop: 307, mobile: 350 },
  { date: "2024-06-16", desktop: 371, mobile: 310 },
  { date: "2024-06-17", desktop: 475, mobile: 520 },
  { date: "2024-06-18", desktop: 107, mobile: 170 },
  { date: "2024-06-19", desktop: 341, mobile: 290 },
  { date: "2024-06-20", desktop: 408, mobile: 450 },
  { date: "2024-06-21", desktop: 169, mobile: 210 },
  { date: "2024-06-22", desktop: 317, mobile: 270 },
  { date: "2024-06-23", desktop: 480, mobile: 530 },
  { date: "2024-06-24", desktop: 132, mobile: 180 },
  { date: "2024-06-25", desktop: 141, mobile: 190 },
  { date: "2024-06-26", desktop: 434, mobile: 380 },
  { date: "2024-06-27", desktop: 448, mobile: 490 },
  { date: "2024-06-28", desktop: 149, mobile: 200 },
  { date: "2024-06-29", desktop: 103, mobile: 160 },
  { date: "2024-06-30", desktop: 446, mobile: 400 },
];
const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

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

  // Fetch dashboard statistics
  const { stats, isLoading, error, refetch } = useDashboardStats({
    refreshInterval: 300000, // Refresh every 5 minutes (300 seconds)
    enabled: true,
  });

  // Fetch pending requests count for Branch Manager and Admin
  const {
    count: pendingRequestsCount,
    isLoading: isPendingLoading,
    error: pendingError,
  } = usePendingRequestsCount({
    userId: currentUser?.user_id,
    refreshInterval: 300000, // Refresh every 5 minutes
    enabled: isAdmin(),
  });

  // Sample product data - in production, this should be fetched from API
  const products: Product[] = [
    {
      id: "001",
      name: "LED Bulb",
      category: "Bulbs",
      price: "Php 5.99",
      stock: 100,
      status: "in-stock",
    },
    {
      id: "002",
      name: "Smart Light Strip",
      category: "Smart Lighting",
      price: "Php 29.99",
      stock: 50,
      status: "in-stock",
    },
    {
      id: "003",
      name: "Chandelier",
      category: "Decorative",
      price: "Php 199.99",
      stock: 10,
      status: "low-stock",
    },
    {
      id: "004",
      name: "Floodlight",
      category: "Outdoor",
      price: "Php 49.99",
      stock: 25,
      status: "in-stock",
    },
    {
      id: "005",
      name: "Desk Lamp",
      category: "Lamps",
      price: "Php 39.99",
      stock: 0,
      status: "out-of-stock",
    },
  ];

  // Chart time range filter
  const [timeRange, setTimeRange] = React.useState("90d");

  const filteredData = React.useMemo(() => {
    const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
    const daysToSubtract = daysMap[timeRange as keyof typeof daysMap] || 90;
    const referenceDate = new Date("2024-06-30");
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return chartData.filter((item) => new Date(item.date) >= startDate);
  }, [timeRange]);
  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 `}
    >
      <div className="mt-2 mb-8">
        {/* Welcome Message */}

        <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {User.name || "User"} 👋
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Here’s a quick overview of your dashboard today.
          </p>
        </div>
        {isSuperAdmin() ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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

            {/* Recent Activity Card */}
            <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between">
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
                {isLoading && (
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                )}
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
              {error && (
                <p className="text-sm text-red-500 mt-2">Failed to load data</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Row 1: Stock / Products / Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

              {isBranchManager() && (
                <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative">
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
                    {isBranchManager() && (
                      <button
                        onClick={() => navigate("/categories/add")}
                        className="p-2 rounded-full bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        title="Add Category"
                      >
                        <Plus
                          className="text-green-600 dark:text-green-400"
                          size={16}
                        />
                      </button>
                    )}
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
              )}
            </div>

            {/* Row 2: Requests / Low Stock / Out of Stock */}
            {!isSuperAdmin() && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {isBranchManager() && (
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
                )}

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
            )}

            {/* Row 3: Recent Activity */}
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
            </div>
          </>
        )}
      </div>

      {/* Line Chart Card */}
      <Card className=" bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Area Chart - Interactive</CardTitle>
            <CardDescription>
              Showing total visitors for the last 3 months
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-desktop)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-desktop)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-mobile)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-mobile)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="mobile"
                type="natural"
                fill="url(#fillMobile)"
                stroke="var(--color-mobile)"
                stackId="a"
              />
              <Area
                dataKey="desktop"
                type="natural"
                fill="url(#fillDesktop)"
                stroke="var(--color-desktop)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

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
                    Product ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide hidden sm:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide hidden md:table-cell">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/70 dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base text-gray-900 dark:text-gray-100">
                      {product.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base font-medium text-gray-900 dark:text-gray-100">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                      {product.category}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base text-gray-700 dark:text-gray-300">
                      {product.price}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base text-gray-700 dark:text-gray-300 hidden md:table-cell">
                      {product.stock}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base">
                      <span
                        className={`px-3 py-1 inline-flex text-xs md:text-sm font-medium rounded-full shadow-sm ${
                          product.status === "in-stock"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : product.status === "low-stock"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        }`}
                      >
                        {product.status === "in-stock"
                          ? "In Stock"
                          : product.status === "low-stock"
                          ? "Low Stock"
                          : "Out of Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
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
                    stats.lastUpdated
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
    </div>
  );
}

export default Dashboard;
