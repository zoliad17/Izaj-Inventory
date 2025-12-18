"use client";

import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";

// Define the data structure
interface ChartData {
  productName: string;
  sales: number;
}

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(12, 76%, 61%)", // Red-orange color to match dashboard theme
  },
  product0: {
    label: "Product 1",
    color: "hsl(12, 76%, 61%)", // red-orange
  },
  product1: {
    label: "Product 2",
    color: "hsl(173, 58%, 39%)", // teal
  },
  product2: {
    label: "Product 3",
    color: "hsl(217, 91%, 60%)", // blue
  },
  product3: {
    label: "Product 4",
    color: "hsl(280, 85%, 67%)", // purple
  },
  product4: {
    label: "Product 5",
    color: "hsl(48, 96%, 53%)", // yellow
  },
  label: {
    color: "hsl(0, 0%, 100%)", // White for light mode
    theme: {
      light: "hsl(0, 0%, 100%)",
      dark: "hsl(0, 0%, 100%)", // Keep white for dark mode too
    },
  },
} satisfies ChartConfig;

interface CustomBarChartProps {
  topProducts: { product_name: string; total_sold: number }[];
}

export function CustomBarChart({ topProducts }: CustomBarChartProps) {
  // Transform the top products data for the chart
  const chartData: ChartData[] = topProducts.map((product) => ({
    productName: product.product_name,
    sales: product.total_sold,
  }));
  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <CardHeader>
        <CardTitle>Top 5 Products</CardTitle>
        <CardDescription>Best selling products</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-gray-600 [&_.recharts-cartesian-axis-tick_text]:dark:fill-gray-300"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              right: 16,
              left: 0,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="productName"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={80}
              hide={true}
            />
            <XAxis dataKey="sales" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
                  formatter={(value, name, props) => {
                    const index = chartData.findIndex((d) => d.sales === value);
                    return [
                      value,
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: `var(--color-product${index})`,
                          }}
                        />
                        {chartData[index]?.productName || name}
                      </div>,
                    ];
                  }}
                />
              }
            />
            <Bar dataKey="sales" layout="vertical" radius={4}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`var(--color-product${index})`}
                />
              ))}
              <LabelList
                dataKey="productName"
                position="insideLeft"
                offset={8}
                className="fill-[--color-label] font-medium"
                fontSize={13}
                style={{
                  fill: "hsl(0, 0%, 100%)",
                  textShadow: "1px 1px 2px hsla(0, 0%, 0%, 0.5)",
                }}
              />
              <LabelList
                dataKey="sales"
                position="right"
                offset={8}
                className="fill-foreground font-medium"
                fontSize={13}
                style={{
                  fill: "hsl(120, 100%, 30%)",
                  textShadow: "1px 1px 2px hsla(0, 0%, 0%, 0.5)",
                }}
              />
              {/* <LabelList
                dataKey="sales"
                position="center"
                className="fill-[--color-label] font-bold"
                fontSize={14}
                style={{
                  fill: "#ffffff",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                }}
                formatter={(value) => `${value}`}
              /> */}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium text-gray-700 dark:text-gray-200">
          Top performing products <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none text-gray-500 dark:text-gray-300">
          Showing sales data for top 5 products
        </div>
      </CardFooter>
    </Card>
  );
}
