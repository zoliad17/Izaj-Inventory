import {
  ArrowLeft,
  Clock,
  Lightbulb,
  TrendingUp,
  ShoppingCart,
  Calendar,
  BarChartIcon,
  LineChartIcon,
  RefreshCw,
  Download,
  Upload,
  Filter,
  Coins,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
} from "recharts";

import { useSidebar } from "../Sidebar/SidebarContext";
import { Toaster } from "react-hot-toast";
import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as XLSX from "xlsx";

export const description = "A sales dashboard with statistics and charts";

const Sales: React.FC = () => {
  // Import and Export functionality
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const normalizeStatus = (value: unknown): string => {
    const raw = String(value ?? "")
      .toLowerCase()
      .trim();
    if (raw === "in stock" || raw === "in-stock" || raw === "instock")
      return "in-stock";
    if (raw === "low stock" || raw === "low-stock" || raw === "lowstock")
      return "low-stock";
    if (
      raw === "out of stock" ||
      raw === "out-of-stock" ||
      raw === "outofstock"
    )
      return "out-of-stock";
    return raw ? raw : "in-stock";
  };

  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData = products.map((product) => ({
        "Product ID": product.id,
        "Product Name": product.name,
        Category: product.category,
        Price: product.price,
        Stock: product.stock,
        Status:
          product.status === "in-stock"
            ? "In Stock"
            : product.status === "low-stock"
            ? "Low Stock"
            : "Out of Stock",
      }));

      // Prepare sales datasets
      const salesTrendData = line_chartData.map((row) => ({
        Month: row.month,
        "Sales (₱)": row.sales,
        "Products Sold": row.products,
      }));
      const categorySalesData = bar_chartData.map((row) => ({
        Category: row.category,
        "Sales (₱)": row.sales,
      }));

      // Create worksheets and workbook
      const wsProducts = XLSX.utils.json_to_sheet(exportData);
      const wsSalesTrend = XLSX.utils.json_to_sheet(salesTrendData);
      const wsCategorySales = XLSX.utils.json_to_sheet(categorySalesData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, wsProducts, "Products");
      XLSX.utils.book_append_sheet(workbook, wsSalesTrend, "Sales Trend");
      XLSX.utils.book_append_sheet(workbook, wsCategorySales, "Category Sales");

      // Generate filename with current date
      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `sales_data_${currentDate}.xlsx`;

      // Export the file
      XLSX.writeFile(workbook, filename);
      console.log(`Sales data exported successfully as ${filename}`);
    } catch (error) {
      console.error("Error exporting sales data:", error);
      alert("Failed to export sales data. Please try again.");
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        {
          defval: "",
        }
      );

      const imported = rows
        .map((row, index) => {
          const id = String(
            (row["Product ID"] ?? row["ID"] ?? row["id"] ?? index + 1) as
              | string
              | number
          );
          const name = String(
            (row["Product Name"] ?? row["Name"] ?? row["name"] ?? "") as string
          );
          const category = String(
            (row["Category"] ?? row["category"] ?? "") as string
          );
          const priceValue = row["Price"] ?? row["price"] ?? "";
          const price =
            typeof priceValue === "number"
              ? `₱${priceValue}`
              : String(priceValue);
          const stock = Number(row["Stock"] ?? row["stock"] ?? 0);
          const status = normalizeStatus(
            row["Status"] ?? row["status"] ?? "in-stock"
          );
          return { id, name, category, price, stock, status } as Product;
        })
        .filter((p) => p.id && p.name);

      if (!imported.length) {
        alert("No valid rows found in the selected file.");
      } else {
        setProducts(imported);
        console.log(`Imported ${imported.length} products from ${file.name}`);
      }
    } catch (error) {
      console.error("Error importing sales data:", error);
      alert("Failed to import sales data. Please check the file format.");
    } finally {
      // reset input so selecting the same file again will trigger onChange
      event.target.value = "";
    }
  };
  // Bar chart options for lighting products
  const bar_chartData = [
    { category: "LED Bulbs", sales: 18600 },
    { category: "Smart Lighting", sales: 30500 },
    { category: "Decorative", sales: 23700 },
    { category: "Outdoor", sales: 7300 },
    { category: "Lamps", sales: 20900 },
  ];
  const bar_chartConfig = {
    sales: {
      label: "Sales (₱)",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  // Line chart data for lighting products sales
  const line_chartData = [
    { month: "January", sales: 18600, products: 120 },
    { month: "February", sales: 30500, products: 180 },
    { month: "March", sales: 23700, products: 150 },
    { month: "April", sales: 7300, products: 80 },
    { month: "May", sales: 20900, products: 140 },
    { month: "June", sales: 21400, products: 160 },
  ];
  const line_chartConfig = {
    sales: {
      label: "Sales (₱)",
      color: "var(--chart-1)",
    },
    products: {
      label: "Products Sold",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  // Product data
  interface Product {
    id: string;
    name: string;
    // category: string;
    quantity: string;
    unit: string;
    price: string;
    // stock: number;
    // status: string;
  }

  const [products, setProducts] = React.useState<Product[]>([
    {
      id: "001",
      name: "LED Bulb",
      quantity: "100",
      unit: "pcs",
      price: "₱5.99",
    },
  ]);
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 dark:bg-gray-900/70 min-h-screen`}
    >
      <div className="p-2 md:p-3  dark:bg-gray-900/70">
        {/* Toaster for success and error */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
        <div className="flex items-center gap-3 mb-6 m-3.5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center dark:text-gray-200 cursor-pointer text-gray-800 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-1" />
          </button>
          <h5 className="text-xl md:text-2xl font-bold">Sales Dashboard</h5>
          <div className="ml-auto flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-blue-700 dark:text-blue-200 shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] hover:scale-[1.05] active:scale-[0.97] transition-all duration-200"
              title="Import Sales Data"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-green-700 dark:text-green-200 shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] hover:scale-[1.05] active:scale-[0.97] transition-all duration-200"
              title="Export Sales Data"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Sales Statistic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 m-2 mb-6">
          {/* Total Sales Card */}
          <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-tr from-green-500/20 to-green-700/20 dark:from-green-800/30 dark:to-green-600/30">
                <Coins
                  className="text-green-600 dark:text-green-400"
                  size={22}
                />
              </div>
              <div>
                <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Total Sales
                </h5>
              </div>
            </div>
            <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              ₱24,560
            </h6>
            <p className="text-sm text-gray-500 mt-1">Lifetime sales</p>
            <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400 text-sm font-medium">
              <TrendingUp size={16} />
              <span>12.5% from last month</span>
            </div>
          </div>

          {/* Monthly Sales Card */}
          <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-tr from-blue-500/20 to-blue-700/20 dark:from-blue-800/30 dark:to-blue-600/30">
                <Calendar
                  className="text-blue-600 dark:text-blue-400"
                  size={22}
                />
              </div>
              <div>
                <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  Monthly Sales
                </h5>
              </div>
            </div>
            <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              ₱4,250
            </h6>
            <p className="text-sm text-gray-500 mt-1">This month</p>
            <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400 text-sm font-medium">
              <TrendingUp size={16} />
              <span>8.2% from last month</span>
            </div>
          </div>

          {/* Orders Card */}
          <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-tr from-purple-500/20 to-purple-700/20 dark:from-purple-800/30 dark:to-purple-600/30">
                <ShoppingCart
                  className="text-purple-600 dark:text-purple-400"
                  size={22}
                />
              </div>
              <div>
                <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  Orders
                </h5>
              </div>
            </div>
            <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              142
            </h6>
            <p className="text-sm text-gray-500 mt-1">Total orders</p>
            <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400 text-sm font-medium">
              <TrendingUp size={16} />
              <span>5.3% from last month</span>
            </div>
          </div>

          {/* Average Order Value Card */}
          <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-700/20 dark:from-amber-800/30 dark:to-amber-600/30">
                <Coins
                  className="text-amber-600 dark:text-amber-400"
                  size={22}
                />
              </div>
              <div>
                <h5 className="font-bold text-lg md:text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  Avg. Order Value
                </h5>
              </div>
            </div>
            <h6 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              ₱172
            </h6>
            <p className="text-sm text-gray-500 mt-1">Per order</p>
            <div className="flex items-center gap-1 mt-2 text-green-600 dark:text-green-400 text-sm font-medium">
              <TrendingUp size={16} />
              <span>3.1% from last month</span>
            </div>
          </div>
        </div>

        {/* Middle Row - Charts */}
        <div className="space-y-6 m-2">
          {/* Line Chart - Sales Trend */}
          <Card className=" dark:bg-gray-900/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5 text-blue-500" />
                  Sales Trend
                </CardTitle>
                <CardDescription>
                  Monthly sales and products sold for lighting products
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <Select defaultValue="6m">
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 month</SelectItem>
                    <SelectItem value="3m">3 months</SelectItem>
                    <SelectItem value="6m">6 months</SelectItem>
                    <SelectItem value="1y">1 year</SelectItem>
                  </SelectContent>
                </Select>
                <button className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Filter className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Download className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={line_chartConfig}
                className="h-[200px] w-[100%]"
              >
                <LineChart
                  height={200}
                  accessibilityLayer
                  data={line_chartData}
                  margin={{
                    top: 20,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={5}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3"
                      />
                    }
                  />
                  <ChartLegend
                    content={
                      <ChartLegendContent className="flex gap-4 justify-center" />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--color-sales)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Sales (₱)"
                  />
                  <Line
                    type="monotone"
                    dataKey="products"
                    stroke="var(--color-products)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Products Sold"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 leading-none font-medium">
                Trending up by 5.2% this month{" "}
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                Showing sales trend for the last 6 months
              </div>
            </CardFooter>
          </Card>

          {/* Bar Chart - Product Category Sales */}
          <Card className=" dark:bg-gray-900/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChartIcon className="h-5 w-5 text-green-500" />
                  Product Category Performance
                </CardTitle>
                <CardDescription>
                  Sales by lighting product category
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="top5">Top 5</SelectItem>
                    <SelectItem value="bottom5">Bottom 5</SelectItem>
                  </SelectContent>
                </Select>
                <button className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Filter className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Download className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={bar_chartConfig}
                className="h-[200px] w-[100%]"
              >
                <BarChart
                  height={200}
                  accessibilityLayer
                  data={bar_chartData}
                  margin={{
                    top: 20,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="category"
                    tickLine={false}
                    tickMargin={5}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dashed"
                        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3"
                      />
                    }
                  />
                  <ChartLegend
                    content={
                      <ChartLegendContent className="flex gap-4 justify-center" />
                    }
                  />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={8}>
                    <LabelList
                      position="top"
                      offset={12}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 leading-none font-medium">
                Best performing category: Smart Lighting{" "}
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                Showing sales by product category
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Bottom Row - Products Table */}
        <Card className=" m-2 dark:bg-gray-900/70 mt-6 ">
          <div className="py-1 md:px-6">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <Lightbulb
                className="text-gray-500 dark:text-gray-400"
                size={20}
              />
              <h5 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Top Products
              </h5>
            </div>

            <div className="overflow-x-auto  dark:bg-gray-900/70">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-900  dark:bg-gray-900/70">
                <thead className="bg-gray-50 dark:bg-gray-900/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Item Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Item Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-white  dark:bg-gray-900/70 divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {product.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                        {product.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                        {product.unit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.price}
                      </td>
                      {/* <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                        {product.stock}
                      </td> */}
                      {/* <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-4 py-3 md:px-6 bg-gray-50 dark:bg-gray-900/70 border-t border-gray-200 dark:border-gray-600 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock size={16} className="text-gray-400 dark:text-gray-500" />
            <span>Last updated 3 mins ago</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Sales;
