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
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
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
} from "eoqguide/src/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "eoqguide/src/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "eoqguide/src/components/ui/select";

// Sample chart data - updated to focus on lighting products
const chartData = [
  { date: "2024-04-01", led: 120, smart: 80, decorative: 60 },
  { date: "2024-04-02", led: 150, smart: 90, decorative: 70 },
  { date: "2024-04-03", led: 130, smart: 95, decorative: 65 },
  { date: "2024-04-04", led: 140, smart: 100, decorative: 75 },
  { date: "2024-04-05", led: 160, smart: 110, decorative: 80 },
  { date: "2024-04-06", led: 170, smart: 115, decorative: 85 },
  { date: "2024-04-07", led: 155, smart: 105, decorative: 78 },
  { date: "2024-04-08", led: 180, smart: 125, decorative: 90 },
  { date: "2024-04-09", led: 140, smart: 95, decorative: 70 },
  { date: "2024-04-10", led: 165, smart: 110, decorative: 80 },
  { date: "2024-04-11", led: 175, smart: 120, decorative: 85 },
  { date: "2024-04-12", led: 160, smart: 110, decorative: 75 },
  { date: "2024-04-13", led: 185, smart: 130, decorative: 95 },
  { date: "2024-04-14", led: 150, smart: 100, decorative: 70 },
  { date: "2024-04-15", led: 140, smart: 95, decorative: 65 },
  { date: "2024-04-16", led: 155, smart: 105, decorative: 75 },
  { date: "2024-04-17", led: 190, smart: 135, decorative: 100 },
  { date: "2024-04-18", led: 180, smart: 125, decorative: 90 },
  { date: "2024-04-19", led: 165, smart: 115, decorative: 80 },
  { date: "2024-04-20", led: 130, smart: 90, decorative: 65 },
  { date: "2024-04-21", led: 145, smart: 100, decorative: 70 },
  { date: "2024-04-22", led: 160, smart: 110, decorative: 80 },
  { date: "2024-04-23", led: 150, smart: 105, decorative: 75 },
  { date: "2024-04-24", led: 185, smart: 130, decorative: 95 },
  { date: "2024-04-25", led: 165, smart: 115, decorative: 80 },
  { date: "2024-04-26", led: 125, smart: 85, decorative: 60 },
  { date: "2024-04-27", led: 190, smart: 140, decorative: 105 },
  { date: "2024-04-28", led: 140, smart: 95, decorative: 70 },
  { date: "2024-04-29", led: 170, smart: 120, decorative: 85 },
  { date: "2024-04-30", led: 200, smart: 150, decorative: 110 },
];

// Radar chart data based on product categories
const radarData = [
  { subject: "LED Products", A: 120, fullMark: 150 },
  { subject: "Smart Lighting", A: 110, fullMark: 150 },
  { subject: "Decorative", A: 95, fullMark: 150 },
  { subject: "Outdoor", A: 75, fullMark: 150 },
  { subject: "Lamps", A: 65, fullMark: 150 },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  led: {
    label: "LED Products",
    color: "var(--chart-1)",
  },
  smart: {
    label: "Smart Lighting",
    color: "var(--chart-2)",
  },
  decorative: {
    label: "Decorative",
    color: "var(--chart-3)",
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
    const referenceDate = new Date("2024-04-30");
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return chartData.filter((item) => new Date(item.date) >= startDate);
  }, [timeRange]);

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 dark:bg-gray-900/70 min-h-screen `}
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Line Chart Card */}
        <Card className="lg:col-span-8 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Lighting Product Sales</CardTitle>
              <CardDescription>
                Showing sales trends for different lighting product categories
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
                  <linearGradient id="fillLed" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-led)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-led)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillSmart" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-smart)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-smart)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fillDecorative"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-decorative)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-decorative)"
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
                  dataKey="decorative"
                  type="natural"
                  fill="url(#fillDecorative)"
                  stroke="var(--color-decorative)"
                  stackId="a"
                />
                <Area
                  dataKey="smart"
                  type="natural"
                  fill="url(#fillSmart)"
                  stroke="var(--color-smart)"
                  stackId="a"
                />
                <Area
                  dataKey="led"
                  type="natural"
                  fill="url(#fillLed)"
                  stroke="var(--color-led)"
                  stackId="a"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Radar Chart Card */}
        <Card className="lg:col-span-4 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <CardTitle>Product Category Performance</CardTitle>
              <CardDescription>
                Performance comparison across product categories
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={{
                ...chartConfig,
                performance: {
                  label: "Performance",
                  color: "var(--chart-1)",
                },
              }}
              className="aspect-auto h-[250px] w-full"
            >
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                <Radar
                  name="Performance"
                  dataKey="A"
                  stroke="var(--color-performance)"
                  fill="var(--color-performance)"
                  fillOpacity={0.6}
                  dot={{ r: 4, fill: "var(--color-performance)" }}
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
