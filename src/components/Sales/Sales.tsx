import ReactECharts from "echarts-for-react";
import { Clock, Lightbulb, PieChartIcon, Zap } from "lucide-react";
import { useSidebar } from "../Sidebar/SidebarContext";

const Sales: React.FC = () => {
  // Bar chart options
  const barChartOptions = {
    title: {
      text: "Lighting Business Sales",
      subtext: "Monthly Sales Data",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {
      bottom: 10,
      data: ["LED Bulbs", "Tube Lights", "Smart Lights"],
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "20%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
      name: "Sales (in USD)",
      nameLocation: "middle",
      nameGap: 30,
    },
    series: [
      {
        name: "LED Bulbs",
        type: "bar",
        data: [
          1200, 1500, 1800, 2000, 2300, 2500, 2700, 3000, 3200, 3500, 3700,
          4000,
        ],
        itemStyle: {
          color: "#4f46e5", // Indigo
        },
      },
      {
        name: "Tube Lights",
        type: "bar",
        data: [
          800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000,
        ],
        itemStyle: {
          color: "#10b981", // Emerald
        },
      },
      {
        name: "Smart Lights",
        type: "bar",
        data: [
          500, 700, 900, 1100, 1300, 1500, 1700, 1900, 2100, 2300, 2500, 2700,
        ],
        itemStyle: {
          color: "#f59e0b", // Amber
        },
      },
    ],
  };

  // Radar chart options
  const radarChartOptions = {
    title: {
      //   text: "Product Performance",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "item",
    },
    legend: {
      data: ["LED Bulbs", "Smart Lights"],
      bottom: 10,
    },
    radar: {
      indicator: [
        { name: "Sales", max: 5000 },
        { name: "Profit Margin", max: 100 },
        { name: "Customer Rating", max: 5 },
        { name: "Market Share", max: 100 },
        { name: "Return Rate", max: 10 },
        { name: "Growth", max: 100 },
      ],
      shape: "circle",
      splitNumber: 5,
      axisName: {
        color: "#333",
      },
      splitArea: {
        areaStyle: {
          color: ["rgba(79, 70, 229, 0.1)", "rgba(79, 70, 229, 0.2)"],
          shadowColor: "rgba(0, 0, 0, 0.2)",
          shadowBlur: 10,
        },
      },
      axisLine: {
        lineStyle: {
          color: "rgba(79, 70, 229, 0.5)",
        },
      },
      splitLine: {
        lineStyle: {
          color: "rgba(79, 70, 229, 0.5)",
        },
      },
    },
    series: [
      {
        name: "Product Comparison",
        type: "radar",
        data: [
          {
            value: [4200, 75, 4.8, 65, 2.5, 85],
            name: "LED Bulbs",
            areaStyle: {
              color: "rgba(79, 70, 229, 0.4)",
            },
            lineStyle: {
              color: "#4f46e5",
              width: 2,
            },
            symbolSize: 6,
          },
          {
            value: [2700, 85, 4.5, 35, 1.8, 95],
            name: "Smart Lights",
            areaStyle: {
              color: "rgba(245, 158, 11, 0.4)",
            },
            lineStyle: {
              color: "#f59e0b",
              width: 2,
            },
            symbolSize: 6,
          },
        ],
      },
    ],
  };

  const pieChartOptions = {
    title: {
      //   text: "Stock Distribution",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)",
    },
    legend: {
      orient: "horizontal",
      bottom: 0,
      left: "center",
    },
    series: [
      {
        name: "Stock",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: "{b}: {c} ({d}%)",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: true,
        },
        data: [
          { value: 100, name: "LED Bulb", itemStyle: { color: "#4f46e5" } },
          {
            value: 50,
            name: "Smart Light Strip",
            itemStyle: { color: "#10b981" },
          },
          { value: 10, name: "Chandelier", itemStyle: { color: "#f59e0b" } },
          { value: 25, name: "Floodlight", itemStyle: { color: "#3b82f6" } },
          { value: 0, name: "Desk Lamp", itemStyle: { color: "#ef4444" } },
        ],
      },
    ],
  };

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
      <div className="p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Sales Dashboard</h1>

        {/* Top Row - Pie and Radar Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pie Chart Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <PieChartIcon className="text-gray-500" size={20} />
                <h5 className="text-lg font-medium">Stock Distribution</h5>
              </div>
              <div className="h-64 md:h-80">
                <ReactECharts
                  option={pieChartOptions}
                  style={{ height: "100%", width: "100%" }}
                  className="echarts-for-react"
                />
              </div>
            </div>
            <div className="p-3 md:p-4 bg-gray-50 flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              <span>Last updated 3 mins ago</span>
            </div>
          </div>

          {/* Radar Chart Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="text-gray-500" size={20} />
                <h5 className="text-lg font-medium">Product Performance</h5>
              </div>
              <div className="h-64 md:h-80">
                <ReactECharts
                  option={radarChartOptions}
                  style={{ height: "100%", width: "100%" }}
                  className="echarts-for-react"
                />
              </div>
            </div>
            <div className="p-3 md:p-4 bg-gray-50 flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              <span>Last updated 3 mins ago</span>
            </div>
          </div>
        </div>

        {/* Middle Row - Bar Chart */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="text-gray-500" size={20} />
                <h5 className="text-lg font-medium">Monthly Sales</h5>
              </div>
              <div className="h-64 md:h-80">
                <ReactECharts
                  option={barChartOptions}
                  style={{ height: "100%", width: "100%" }}
                  className="echarts-for-react"
                />
              </div>
            </div>
            <div className="p-3 md:p-4 bg-gray-50 flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              <span>Last updated 3 mins ago</span>
            </div>
          </div>
        </div>

        {/* Bottom Row - Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <Lightbulb className="text-gray-500" size={20} />
              <h5 className="text-lg font-medium">Top Products</h5>
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
        </div>
      </div>
    </div>
  );
};

export default Sales;
