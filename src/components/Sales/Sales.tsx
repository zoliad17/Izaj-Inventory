import { Clock, Lightbulb } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Radar,
  RadialBar,
  RadialBarChart,
  XAxis,
} from "recharts";

import { useSidebar } from "../Sidebar/SidebarContext";
import { Toaster } from "react-hot-toast";
("use client");
import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Pie, PieChart, PolarAngleAxis, PolarGrid, RadarChart } from "recharts";
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
} from "@/components/ui/chart";

export const description = "A pie chart with stacked sections";

const Sales: React.FC = () => {
  // Bar chart options
  const bar_chartData = [
    { month: "January", desktop: 186 },
    { month: "February", desktop: 305 },
    { month: "March", desktop: 237 },
    { month: "April", desktop: 73 },
    { month: "May", desktop: 209 },
    { month: "June", desktop: 214 },
    { month: "July", desktop: 254 },
    { month: "August", desktop: 234 },
    { month: "September", desktop: 150 },
    { month: "October", desktop: 244 },
    { month: "November", desktop: 114 },
    { month: "December", desktop: 200 },
  ];
  const bar_chartConfig = {
    desktop: {
      label: "Desktop",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  // Radar chart options
  const radar_chartData = [
    { month: "January", desktop: 186 },
    { month: "February", desktop: 285 },
    { month: "March", desktop: 237 },
    { month: "April", desktop: 203 },
    { month: "May", desktop: 209 },
    { month: "June", desktop: 264 },
  ];
  const radar_chartConfig = {
    desktop: {
      label: "Desktop",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;
  //  pie chart options

  const desktopData = [
    { month: "january", desktop: 186, fill: "var(--color-january)" },
    { month: "february", desktop: 305, fill: "var(--color-february)" },
    { month: "march", desktop: 237, fill: "var(--color-march)" },
    { month: "april", desktop: 173, fill: "var(--color-april)" },
    { month: "may", desktop: 209, fill: "var(--color-may)" },
  ];
  const mobileData = [
    { month: "january", mobile: 80, fill: "var(--color-january)" },
    { month: "february", mobile: 200, fill: "var(--color-february)" },
    { month: "march", mobile: 120, fill: "var(--color-march)" },
    { month: "april", mobile: 190, fill: "var(--color-april)" },
    { month: "may", mobile: 130, fill: "var(--color-may)" },
  ];
  const chartConfig = {
    visitors: {
      label: "Visitors",
    },
    desktop: {
      label: "Desktop",
    },
    mobile: {
      label: "Mobile",
    },
    january: {
      label: "January",
      color: "var(--chart-1)",
    },
    february: {
      label: "February",
      color: "var(--chart-2)",
    },
    march: {
      label: "March",
      color: "var(--chart-3)",
    },
    april: {
      label: "April",
      color: "var(--chart-4)",
    },
    may: {
      label: "May",
      color: "var(--chart-5)",
    },
  } satisfies ChartConfig;

  // radical chart options

  const radical_chartData = [
    { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
    { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
    { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
    { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
    { browser: "other", visitors: 90, fill: "var(--color-other)" },
  ];
  const radical_chartConfig = {
    visitors: {
      label: "Visitors",
    },
    chrome: {
      label: "Chrome",
      color: "var(--chart-2)",
    },
    safari: {
      label: "Safari",
      color: "var(--chart-2)",
    },
    firefox: {
      label: "Firefox",
      color: "var(--chart-3)",
    },
    edge: {
      label: "Edge",
      color: "var(--chart-4)",
    },
    other: {
      label: "Other",
      color: "var(--chart-5)",
    },
  } satisfies ChartConfig;
  // Product data
  interface Product {
    id: string;
    name: string;
    category: string;
    price: string;
    stock: number;
    status: string;
  }

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
  const { isCollapsed } = useSidebar();
  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 `}
    >
      <div className="p-2 md:p-3">
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
        <h5 className="text-xl md:text-xl font-bold mb-6">Sales Dashboard</h5>

        {/* Top Row - Pie and Radar Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Pie Chart Card */}
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle>Pie Chart - Stacked</CardTitle>
              <CardDescription>January - June 2024</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[200px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelKey="visitors"
                        nameKey="month"
                        indicator="line"
                        labelFormatter={(_, payload) => {
                          return chartConfig[
                            payload?.[0].dataKey as keyof typeof chartConfig
                          ].label;
                        }}
                      />
                    }
                  />
                  <Pie data={desktopData} dataKey="desktop" outerRadius={60} />
                  <Pie
                    data={mobileData}
                    dataKey="mobile"
                    innerRadius={70}
                    outerRadius={90}
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 leading-none font-medium">
                Trending up by 5.2% this month{" "}
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                Showing total visitors for the last 6 months
              </div>
            </CardFooter>
          </Card>

          {/* Radar Chart Card */}
          <Card>
            <CardHeader className="items-center pb-4">
              <CardTitle>Radar Chart - Grid Circle Filled</CardTitle>
              <CardDescription>
                Showing total visitors for the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              <ChartContainer
                config={radar_chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <RadarChart data={radar_chartData}>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <PolarGrid
                    className="fill-(--color-desktop) opacity-20"
                    gridType="circle"
                  />
                  <PolarAngleAxis dataKey="month" />
                  <Radar
                    dataKey="desktop"
                    fill="var(--color-desktop)"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 leading-none font-medium">
                Trending up by 5.2% this month{" "}
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground flex items-center gap-2 leading-none">
                January - June 2024
              </div>
            </CardFooter>
          </Card>

          {/* radical Chart*/}
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle>Radial Chart</CardTitle>
              <CardDescription>January - June 2024</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={radical_chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <RadialBarChart
                  data={radical_chartData}
                  innerRadius={30}
                  outerRadius={110}
                >
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent hideLabel nameKey="browser" />
                    }
                  />
                  <RadialBar dataKey="visitors" background />
                </RadialBarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 leading-none font-medium">
                Trending up by 5.2% this month{" "}
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                Showing total visitors for the last 6 months
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Middle Row - Bar Chart */}

        <Card className=" mb-6">
          <CardHeader>
            <CardTitle>Bar Chart - Label</CardTitle>
            <CardDescription>January - June 2024</CardDescription>
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
                  dataKey="month"
                  tickLine={false}
                  tickMargin={5}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8}>
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
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground leading-none">
              Showing total visitors for the last 6 months
            </div>
          </CardFooter>
        </Card>

        {/* Bottom Row - Products Table */}
        <Card>
          <div className="py-1 md:px-6 ">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <Lightbulb className="text-gray-500" size={20} />
              <h5 className="text-lg font-medium mt-[-3]">Top Products</h5>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {product.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {product.category}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {product.price}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {product.stock}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.status === "in-stock"
                              ? "bg-green-100 text-green-800"
                              : product.status === "low-stock"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
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
          <div className="p-3 md:p-4 bg-gray-50 flex items-center gap-2 text-sm text-gray-500">
            <Clock size={16} />
            <span>Last updated 3 mins ago</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Sales;
