import ReactECharts from "echarts-for-react";
import { useSidebar } from "../Sidebar/SidebarContext";
import {
  Package,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Lightbulb,
  //   AlertCircle,
  Clock,
  Plus,
} from "lucide-react";
import SearchBar from "../Search_Bar/SearchBar";
import { useNavigate } from "react-router-dom";

// Define types for the product data
interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

// Define types for the ECharts options
interface PieChartOptions {
  tooltip: {
    trigger: string;
  };
  legend: {
    top: string;
    left: string;
  };
  series: Array<{
    name: string;
    type: string;
    radius: string[];
    avoidLabelOverlap: boolean;
    itemStyle: {
      borderRadius: number;
      borderColor: string;
      borderWidth: number;
    };
    label: {
      show: boolean;
      position: string;
    };
    emphasis: {
      label: {
        show: boolean;
        fontSize: string;
        fontWeight: string;
      };
    };
    labelLine: {
      show: boolean;
    };
    data: Array<{
      value: number;
      name: string;
      itemStyle: { color: string };
    }>;
  }>;
}

interface LineChartOptions {
  tooltip: {
    trigger: string;
    axisPointer: {
      type: string;
    };
  };
  xAxis: {
    type: string;
    data: string[];
  };
  yAxis: {
    type: string;
  };
  series: Array<{
    name: string;
    data: number[];
    type: string;
    smooth: boolean;
    lineStyle: {
      color: string;
      width: number;
    };
    areaStyle: {
      color: {
        type: string;
        x: number;
        y: number;
        x2: number;
        y2: number;
        colorStops: Array<{
          offset: number;
          color: string;
        }>;
      };
    };
  }>;
}

function Dashboard() {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();

  // Get user role from localStorage
  const userRole = localStorage.getItem("userRole");
  const isSuperAdmin = userRole === "Super Admin";
  // Options for the Pie Chart
  const pieChartOptions: PieChartOptions = {
    tooltip: {
      trigger: "item",
    },
    legend: {
      top: "5%",
      left: "center",
    },
    series: [
      {
        name: "Stock Distribution",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: "18",
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: 300, name: "LED Bulbs", itemStyle: { color: "#FF6384" } },
          { value: 50, name: "Smart Lights", itemStyle: { color: "#36A2EB" } },
          { value: 100, name: "Chandeliers", itemStyle: { color: "#FFCE56" } },
        ],
      },
    ],
  };

  // Options for the Line Chart
  const lineChartOptions: LineChartOptions = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    xAxis: {
      type: "category",
      data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "Monthly Stock Movement",
        data: [65, 59, 80, 81, 56, 55, 40],
        type: "line",
        smooth: true,
        lineStyle: {
          color: "rgba(75,192,192,1)",
          width: 3,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(75,192,192,0.4)",
              },
              {
                offset: 1,
                color: "rgba(75,192,192,0.1)",
              },
            ],
          },
        },
      },
    ],
  };

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // custom search logic here
  };

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

  return (
    <div
      className={`transition-all duration-300 ${isCollapsed ? "ml-5" : "ml-1"
        } p-2 sm:p-4 `}
    >
      <div className="grid mt-1.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Stock Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <Package className="text-amber-600" size={20} />
            </div>
            <h5 className="text-lg font-medium">Total Stock</h5>
          </div>
          <h6 className="text-2xl font-bold text-gray-800 mt-2">450</h6>
        </div>

        {/* Products Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Lightbulb className="text-blue-600" size={20} />
            </div>
            <h5 className="text-lg font-medium">Products</h5>
          </div>
          <h6 className="text-2xl font-bold text-gray-800 mt-2">50</h6>
        </div>

        {/* Categories Card */}
        <div className="bg-white rounded-lg shadow p-6 relative">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Lightbulb className="text-green-600" size={20} />
            </div>
            <h5 className="text-lg font-medium">Categories</h5>
          </div>
          <h6 className="text-2xl font-bold text-gray-800 mt-2">12</h6>
          <button
            onClick={() => navigate("/categories/add")}
            className="absolute top-4 right-4 p-1.5 cursor-pointer bg-green-100 rounded-full hover:bg-green-200 transition-colors"
            title="Add Category"
          >
            <Plus className="text-green-600" size={16} />
          </button>
        </div>

        {/* Branches Card - Only visible to Super Admin */}
        {isSuperAdmin && (
          <div className="bg-white rounded-lg shadow p-6 relative">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Lightbulb className="text-purple-600" size={20} />
              </div>
              <h5 className="text-lg font-medium">Branches</h5>
            </div>
            <h6 className="text-2xl font-bold text-gray-800 mt-2">8</h6>
            <button
              onClick={() => navigate("/branches/add")}
              className="absolute top-4 right-4 p-1.5 cursor-pointer bg-purple-100 rounded-full hover:bg-purple-200 transition-colors"
              title="Add Branch"
            >
              <Plus className="text-purple-600" size={16} />
            </button>
          </div>
        )}
      </div>
      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pie Chart Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden lg:col-span-1">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <PieChartIcon className="text-gray-500" size={20} />
              <h5 className="text-lg font-medium">Stock Distribution</h5>
            </div>
            <div className="h-80  ">
              <ReactECharts
                option={pieChartOptions}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          </div>
          <div className="p-4 bg-gray-50 flex items-center gap-2 text-sm text-gray-500">
            <Clock size={16} />
            <span>Last updated 3 mins ago</span>
          </div>
        </div>

        {/* Line Chart Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <LineChartIcon className="text-gray-500" size={20} />
              <h5 className="text-lg font-medium">Monthly Stock Movement</h5>
            </div>
            <div className="h-80">
              <ReactECharts
                option={lineChartOptions}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          </div>
          <div className="p-4 bg-gray-50 flex items-center gap-2 text-sm text-gray-500">
            <Clock size={16} />
            <span>Last updated 3 mins ago</span>
          </div>
        </div>
      </div>
      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="text-gray-500" size={20} />
            <h5 className="text-lg font-medium">Top Products</h5>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full Php {
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
        <div className="p-4 bg-gray-50 flex items-center gap-2 text-sm text-gray-500">
          <Clock size={16} />
          <span>Last updated 3 mins ago</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
