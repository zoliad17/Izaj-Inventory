import { useSidebar } from "../Sidebar/SidebarContext";
import {
  Package,
  Lightbulb,
  AlertCircle,
  Clock,
  Plus,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardStats } from "../../hooks/useDashboardStats";

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
("use client");
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
export const description = "An interactive area chart";
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

  // Get user role from localStorage
  const userRole = localStorage.getItem("userRole");
  const isSuperAdmin = userRole === "Super Admin";

  // Fetch dashboard statistics
  const { stats, isLoading, error, refetch } = useDashboardStats({
    refreshInterval: 300000, // Refresh every 5 minutes (300 seconds)
    enabled: true,
  });

  // Product data
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

  // shadcn
  const [timeRange, setTimeRange] = React.useState("90d");
  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-06-30");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });
  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 `}
    >
      <div className="mt-1.5 mb-6">
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${
            isSuperAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          {/* Total Stock Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl outline-1 transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <Package
                    className="text-amber-600 dark:text-amber-400"
                    size={20}
                  />
                </div>
                <h5 className="font-bold text-xl md:text-2xl text-gray-900 dark:text-gray-100">
                  Total Stock
                </h5>
              </div>
              {isLoading && (
                <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>
            <h6 className="text-lg md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
              {isLoading
                ? "..."
                : error
                ? "Error"
                : stats?.totalStock?.toLocaleString() || "0"}
            </h6>
            {error && (
              <p className="text-sm md:text-base text-red-500 mt-1">
                Failed to load data
              </p>
            )}
          </div>

          {/* Products Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl outline-1 transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Lightbulb
                    className="text-blue-600 dark:text-blue-400"
                    size={20}
                  />
                </div>
                <h5 className="font-bold text-xl md:text-2xl text-gray-900 dark:text-gray-100">
                  Products
                </h5>
              </div>
              {isLoading && (
                <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>
            <h6 className="text-lg md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
              {isLoading
                ? "..."
                : error
                ? "Error"
                : stats?.totalProducts || "0"}
            </h6>
            {error && (
              <p className="text-sm md:text-base text-red-500 mt-1">
                Failed to load data
              </p>
            )}
          </div>

          {/* Categories Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl outline-1 transition-shadow relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Lightbulb
                    className="text-green-600 dark:text-green-400"
                    size={20}
                  />
                </div>
                <h5 className="font-bold text-xl md:text-2xl text-gray-900 dark:text-gray-100">
                  Categories
                </h5>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                )}
                <button
                  onClick={() => navigate("/categories/add")}
                  className="p-1.5 cursor-pointer bg-green-100 dark:bg-green-900/30 rounded-full hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                  title="Add Category"
                >
                  <Plus
                    className="text-green-600 dark:text-green-400"
                    size={16}
                  />
                </button>
              </div>
            </div>
            <h6 className="text-lg md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
              {isLoading
                ? "..."
                : error
                ? "Error"
                : stats?.totalCategories || "0"}
            </h6>
            {error && (
              <p className="text-sm md:text-base text-red-500 mt-1">
                Failed to load data
              </p>
            )}
          </div>

          {/* Branches Card - Only visible to Super Admin */}
          {isSuperAdmin && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl outline-1 transition-shadow relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <Lightbulb
                      className="text-purple-600 dark:text-purple-400"
                      size={20}
                    />
                  </div>
                  <h5 className="font-bold text-xl md:text-2xl text-gray-900 dark:text-gray-100">
                    Branches
                  </h5>
                </div>
                <div className="flex items-center gap-2">
                  {isLoading && (
                    <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                  )}
                </div>
              </div>
              <h6 className="text-lg md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
                {isLoading
                  ? "..."
                  : error
                  ? "Error"
                  : stats?.totalBranches || "0"}
              </h6>
              {error && (
                <p className="text-sm md:text-base text-red-500 mt-1">
                  Failed to load data
                </p>
              )}
            </div>
          )}
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {/* Low Stock Alert Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl outline-1 transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <AlertCircle
                    className="text-yellow-600 dark:text-yellow-400"
                    size={20}
                  />
                </div>
                <h5 className="font-bold text-xl md:text-2xl text-gray-900 dark:text-gray-100">
                  Low Stock
                </h5>
              </div>
              {isLoading && (
                <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>
            <h6 className="text-lg md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
              {isLoading
                ? "..."
                : error
                ? "Error"
                : stats?.lowStockCount || "0"}
            </h6>
            <p className="font-medium text-gray-500 mt-1">
              Products with less than 20 units
            </p>
            {error && (
              <p className="text-sm text-red-500 mt-1">Failed to load data</p>
            )}
          </div>

          {/* Out of Stock Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl outline-1 transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertCircle
                    className="text-red-600 dark:text-red-400"
                    size={20}
                  />
                </div>
                <h5 className="font-bold text-xl md:text-2xl text-gray-900 dark:text-gray-100">
                  Out of Stock
                </h5>
              </div>
              {isLoading && (
                <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>
            <h6 className="text-lg md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
              {isLoading
                ? "..."
                : error
                ? "Error"
                : stats?.outOfStockCount || "0"}
            </h6>
            <p className="font-medium text-gray-500 mt-1">
              Products with zero units
            </p>
            {error && (
              <p className="text-sm text-red-500 mt-1">Failed to load data</p>
            )}
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl outline-1 transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <TrendingUp
                    className="text-blue-600 dark:text-blue-400"
                    size={20}
                  />
                </div>
                <h5 className="font-bold text-xl md:text-2xl text-gray-900 dark:text-gray-100">
                  Recent Activity
                </h5>
              </div>
              {isLoading && (
                <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>
            <h6 className="text-lg md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-2">
              {isLoading
                ? "..."
                : error
                ? "Error"
                : stats?.recentActivity || "0"}
            </h6>
            <p className="font-medium text-gray-500 mt-1">
              Actions in the last 7 days
            </p>
            {error && (
              <p className="text-sm text-red-500 mt-1">Failed to load data</p>
            )}
          </div>
        </div>
      </div>

      {/* Line Chart Card */}
      <Card className="pt-0">
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

      <Card className="mt-6">
        <div className="py-1 md:px-6">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <Lightbulb className="text-gray-500 dark:text-gray-400" size={20} />
            <h5 className="text-lg md:text-xl font-medium text-gray-900 dark:text-gray-100">
              Top Products
            </h5>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-900">
              <thead className="bg-gray-50 dark:bg-neutral-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Product ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base text-gray-500 dark:text-gray-400">
                      {product.price}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {product.stock}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm md:text-base">
                      <span
                        className={`px-2 inline-flex text-xs md:text-sm leading-5 font-semibold rounded-full ${
                          product.status === "in-stock"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : product.status === "low-stock"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
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

        <div className="px-4 py-3 md:px-6 bg-gray-50 dark:bg-neutral-900 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between text-sm md:text-base text-gray-500 dark:text-gray-400">
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
            className="flex items-center gap-1 px-2 py-1 text-xs md:text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            disabled={isLoading}
            title="Refresh data (minimum 30 seconds between requests)"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
