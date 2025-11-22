import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  BarChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  Package,
  FileUp,
  CheckCircle,
  Upload,
  TrendingUp,
  Zap,
  AlertCircle,
} from "lucide-react";

interface EOQData {
  eoq_quantity: number;
  reorder_point: number;
  safety_stock: number;
  annual_holding_cost: number;
  total_annual_cost: number;
  max_stock_level: number;
  min_stock_level: number;
  average_inventory: number;
}

interface SalesImportMetrics {
  total_quantity: number;
  average_daily: number;
  annual_demand: number;
  days_of_data: number;
  date_range: {
    start: string;
    end: string;
  };
}

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

interface ModalState {
  isOpen: boolean;
  status: "loading" | "success" | "error";
  message: string;
  details?: string;
}

const EOQAnalyticsDashboard: React.FC = () => {
  const [eoqData, setEOQData] = useState<EOQData | null>(null);
  const [eoqList, setEoqList] = useState<EOQData[]>([]);
  const [inventoryAnalytics, setInventoryAnalytics] = useState<any[]>([]);
  const [inventoryTimeframe, setInventoryTimeframe] = useState<string>("");
  const [salesMetrics, setSalesMetrics] = useState<SalesImportMetrics | null>(
    null
  );
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [restockRecommendations, setRestockRecommendations] = useState<
    RestockRecommendation[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    status: "loading",
    message: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize a top-product entry from backend/import to ensure product_name exists
  const normalizeTopProduct = (p: any): TopProduct => ({
    product_id: p?.product_id,
    product_name:
      (p && (p.product_name || p.name || p.product)) ||
      (p && p.product_id ? `Product ${p.product_id}` : "Unknown Product"),
    total_sold: Number(p?.total_sold || p?.quantity || 0),
    avg_daily: Number(p?.avg_daily || 0),
    transaction_count: Number(p?.transaction_count || p?.transactions || 0),
  });

  const normalizeRestock = (r: any): RestockRecommendation => ({
    product_id: r?.product_id,
    product_name:
      (r && (r.product_name || r.name || r.product)) ||
      (r && r.product_id ? `Product ${r.product_id}` : "Unknown Product"),
    last_sold_qty: Number(r?.last_sold_qty || r?.last_total || 0),
    daily_rate: Number(r?.daily_rate || r?.avg_daily_usage || 0),
    recommendation: r?.recommendation || r?.note || "Restock based on usage",
    priority: r?.priority || "low",
  });

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setModal({
        isOpen: true,
        status: "loading",
        message: "Uploading file...",
      });

      try {
        const formData = new FormData();
        formData.append("file", file);

        console.log("Uploading file:", file.name, "Size:", file.size);

        // Send directly to Python backend for file uploads
        // This bypasses the Node.js proxy to avoid multipart handling issues
        const pythonBackendUrl = "http://localhost:5001";
        const response = await fetch(
          `${pythonBackendUrl}/api/analytics/sales-data/import`,
          {
            method: "POST",
            body: formData,
          }
        );

        const result = await response.json();
        console.log("Upload response:", result);

        if (result.success) {
          setSalesMetrics(result.metrics);
          setTopProducts(
            (result.top_products || []).map((p: any) => normalizeTopProduct(p))
          );
          setRestockRecommendations(
            (result.restock_recommendations || []).map((r: any) =>
              normalizeRestock(r)
            )
          );

          // Refresh persisted sales summary and EOQ calculations from backend
          try {
            await fetchSalesSummaryFromServer();
            await fetchEOQCalculationsFromServer();
          } catch (err) {
            console.warn(
              "Failed to refresh persisted analytics after import",
              err
            );
          }

          setModal({
            isOpen: true,
            status: "loading",
            message: "Calculating EOQ with imported data...",
          });

          await new Promise((resolve) => setTimeout(resolve, 800));
          await calculateEOQWithData(result.metrics.annual_demand);
        } else {
          setModal({
            isOpen: true,
            status: "error",
            message: "Failed to import sales data",
            details: result.error || "Unknown error occurred",
          });
        }
      } catch (error) {
        console.error("Upload error:", error);
        setModal({
          isOpen: true,
          status: "error",
          message: "Failed to import sales data",
          details:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    []
  );

  const calculateEOQWithData = useCallback(async (demandValue: number) => {
    try {
      // Send directly to Python backend to avoid Node.js proxy issues
      const pythonBackendUrl = "http://localhost:5001";
      const response = await fetch(
        `${pythonBackendUrl}/api/analytics/eoq/calculate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: 1,
            branch_id: 1,
            annual_demand: demandValue,
            holding_cost: 50,
            ordering_cost: 100,
            unit_cost: 25,
            lead_time_days: 7,
            confidence_level: 0.95,
          }),
        }
      );

      const result = await response.json();
      console.log("EOQ calculation response:", result);

      if (result.success) {
        setEOQData(result.data);
        setModal({
          isOpen: true,
          status: "success",
          message: "EOQ Calculation Complete!",
          details: `EOQ: ${Math.round(
            result.data.eoq_quantity
          )} units | Reorder Point: ${Math.round(
            result.data.reorder_point
          )} units`,
        });
        setTimeout(() => {
          setModal((prev) => ({ ...prev, isOpen: false }));
        }, 3000);
      } else {
        setModal({
          isOpen: true,
          status: "error",
          message: "Failed to calculate EOQ",
          details: result.error || "Unknown error occurred",
        });
      }
    } catch (error) {
      console.error("EOQ calculation error:", error);
      setModal({
        isOpen: true,
        status: "error",
        message: "Failed to calculate EOQ",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }, []);

  // Fetch persisted EOQ calculations from backend
  const fetchEOQCalculationsFromServer = useCallback(async () => {
    try {
      const pythonBackendUrl = "http://localhost:5001";
      const res = await fetch(
        `${pythonBackendUrl}/api/analytics/eoq-calculations?limit=50`
      );
      if (!res.ok)
        throw new Error(`Failed to fetch EOQ calculations: ${res.status}`);
      const payload = await res.json();
      if (payload.success && Array.isArray(payload.data)) {
        // Map to EOQData shape when possible
        const mapped = payload.data.map(
          (r: any) =>
            ({
              eoq_quantity: Number(r.eoq_quantity || r.eoq || 0),
              reorder_point: Number(r.reorder_point || 0),
              safety_stock: Number(r.safety_stock || 0),
              annual_holding_cost: Number(
                r.annual_holding_cost || r.holding_cost || 0
              ),
              total_annual_cost: Number(r.total_annual_cost || 0),
              max_stock_level: Number(r.max_stock_level || 0),
              min_stock_level: Number(r.min_stock_level || 0),
              average_inventory: Number(r.average_inventory || 0),
            } as EOQData)
        );
        setEoqList(mapped);
        if (!eoqData && mapped.length > 0) {
          setEOQData(mapped[0]);
        }
      }
    } catch (err) {
      console.warn("Error fetching EOQ calculations", err);
    }
  }, [eoqData]);

  const fetchTopProductsFromServer = useCallback(async (days = 30) => {
    try {
      const pythonBackendUrl = "http://localhost:5001";
      const res = await fetch(
        `${pythonBackendUrl}/api/analytics/top-products?days=${days}&limit=10`
      );
      if (!res.ok)
        throw new Error(`Failed to fetch top products: ${res.status}`);
      const payload = await res.json();
      if (payload.success && Array.isArray(payload.data)) {
        setTopProducts(payload.data.map((p: any) => normalizeTopProduct(p)));
      }
    } catch (err) {
      console.warn("Error fetching top products", err);
    }
  }, []);

  const fetchInventoryAnalyticsFromServer = useCallback(async (days = 30) => {
    try {
      const pythonBackendUrl = "http://localhost:5001";
      const res = await fetch(
        `${pythonBackendUrl}/api/analytics/inventory-analytics?days=${days}&limit=50`
      );
      if (!res.ok)
        throw new Error(`Failed to fetch inventory analytics: ${res.status}`);
      const payload = await res.json();
      if (payload.success && Array.isArray(payload.data)) {
        setInventoryAnalytics(payload.data);
        setInventoryTimeframe(
          payload.timeframe || (days >= 365 ? "Annual" : "Monthly")
        );
      }
    } catch (err) {
      console.warn("Error fetching inventory analytics", err);
    }
  }, []);

  // Fetch sales summary from backend
  const fetchSalesSummaryFromServer = useCallback(async (days = 30) => {
    try {
      const pythonBackendUrl = "http://localhost:5001";
      const res = await fetch(
        `${pythonBackendUrl}/api/analytics/sales-summary?days=${days}`
      );
      if (!res.ok)
        throw new Error(`Failed to fetch sales summary: ${res.status}`);
      const payload = await res.json();
      if (payload.success && payload.data) {
        const d = payload.data;
        setSalesMetrics({
          total_quantity: Number(d.total_quantity || 0),
          average_daily: Number(d.average_daily || 0),
          annual_demand: Number(
            d.annual_demand || (d.average_daily ? d.average_daily * 365 : 0)
          ),
          days_of_data: Number(d.days_of_data || days),
          date_range: d.date_range || { start: "", end: "" },
        });
      }
    } catch (err) {
      console.warn("Error fetching sales summary", err);
    }
  }, []);

  // Fetch persisted data on mount
  useEffect(() => {
    fetchSalesSummaryFromServer();
    fetchEOQCalculationsFromServer();
    fetchTopProductsFromServer();
    fetchInventoryAnalyticsFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateInventoryChart = () => {
    if (!eoqData) return [];
    const days = 30;
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      current: Math.max(
        eoqData.min_stock_level,
        eoqData.average_inventory - (Math.random() * 20 - 10)
      ),
      reorderPoint: eoqData.reorder_point,
      maxStock: eoqData.max_stock_level,
      minStock: eoqData.min_stock_level,
      safetyStock: eoqData.safety_stock,
    }));
  };

  const generateCostChart = () => {
    if (!eoqData) return [];
    return [
      {
        name: "Holding Cost",
        value: eoqData.annual_holding_cost,
        fill: "#3b82f6",
      },
      {
        name: "Safety Stock Cost",
        value: eoqData.safety_stock * 25 * 0.25,
        fill: "#ef4444",
      },
      {
        name: "Ordering Cost",
        value: eoqData.total_annual_cost - eoqData.annual_holding_cost,
        fill: "#8b5cf6",
      },
    ];
  };

  const inventoryData = generateInventoryChart();
  const costData = generateCostChart();
  // Monthly sales support: compute overall monthly projection and per-product monthly estimates
  const monthsInData = salesMetrics
    ? Math.max(1, salesMetrics.days_of_data / 30)
    : 0;
  const monthlyProjection = salesMetrics
    ? Math.round(salesMetrics.average_daily * 30)
    : null;
  const monthlyFromTotal = salesMetrics
    ? Math.round(salesMetrics.total_quantity / monthsInData)
    : null;

  const derivedTopProducts = topProducts.map((p) => ({
    ...p,
    monthly_estimate: Number((p.avg_daily * 30).toFixed(1)),
  }));
  // Process restock recommendations to compute days-until-stockout and recommended qty
  const processedRestocks = restockRecommendations.map((rec) => {
    const leadTimeDays = 7; // fallback - use backend-provided value if available
    const daily = rec.daily_rate || 0.001;
    const daysUntilStockout = daily > 0 ? rec.last_sold_qty / daily : Infinity;
    // Suggest to restock enough for lead time + safety stock, but at least EOQ
    const baseNeeded = Math.ceil(
      daily * leadTimeDays + (eoqData?.safety_stock || 0)
    );
    const recommendedQty = Math.max(
      baseNeeded - Math.ceil(rec.last_sold_qty),
      Math.ceil(eoqData?.eoq_quantity || baseNeeded)
    );
    return {
      ...rec,
      daysUntilStockout: Number.isFinite(daysUntilStockout)
        ? Number(daysUntilStockout.toFixed(1))
        : Infinity,
      recommendedQty: Math.max(recommendedQty, 0),
    };
  });

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen">
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-8">
            {modal.status === "loading" && (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {modal.message}
                </h2>
                <p className="text-sm text-slate-600 text-center">
                  {modal.details}
                </p>
              </div>
            )}

            {modal.status === "success" && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {modal.message}
                </h2>
                <p className="text-sm text-slate-600 text-center">
                  {modal.details}
                </p>
              </div>
            )}

            {modal.status === "error" && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {modal.message}
                </h2>
                <p className="text-sm text-slate-600 text-center">
                  {modal.details}
                </p>
                <button
                  onClick={() =>
                    setModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            EOQ Analytics Dashboard
          </h1>
          <p className="text-slate-600 mt-1">
            Predictive Analytics for Inventory Optimization
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Import Sales Data from POS
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.xlsx,.xls"
                disabled={uploading}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Select CSV or Excel File"}
              </button>
              <p className="text-sm text-slate-600">
                Upload sales data with columns:{" "}
                <code className="bg-slate-100 px-2 py-1 rounded">quantity</code>{" "}
                and <code className="bg-slate-100 px-2 py-1 rounded">date</code>
              </p>
            </div>
            {salesMetrics && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">
                      Sales Data Analyzed
                    </h3>
                    <p className="text-sm text-slate-500 mb-3">
                      Data range: {salesMetrics.date_range?.start || "-"} to{" "}
                      {salesMetrics.date_range?.end || "-"}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-slate-600 font-medium">
                          Days of Data
                        </p>
                        <p className="text-xl font-bold text-slate-900">
                          {salesMetrics.days_of_data}
                        </p>
                        <p className="text-xs text-slate-400">
                          Number of days in file
                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-slate-600 font-medium">
                                Monthly Projection
                              </p>
                              <p className="text-lg font-bold text-slate-900">
                                {monthlyProjection !== null
                                  ? monthlyProjection.toLocaleString()
                                  : "-"}
                              </p>
                              <p className="text-xs text-slate-400">
                                Estimated units / month (avg_daily × 30)
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600 font-medium">
                                Monthly (from total)
                              </p>
                              <p className="text-lg font-bold text-slate-900">
                                {monthlyFromTotal !== null
                                  ? monthlyFromTotal.toLocaleString()
                                  : "-"}
                              </p>
                              <p className="text-xs text-slate-400">
                                Total quantity ÷ months in file
                              </p>
                            </div>
                          </div>
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-600 font-medium">
                          Total Quantity
                        </p>
                        <p className="text-xl font-bold text-slate-900">
                          {Math.round(
                            salesMetrics.total_quantity
                          ).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">
                          Units sold in file
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-600 font-medium">
                          Average Daily
                        </p>
                        <p className="text-xl font-bold text-slate-900">
                          {salesMetrics.average_daily.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-400">
                          Avg units sold per day
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-600 font-medium">
                          Annual Demand
                        </p>
                        <p className="text-xl font-bold text-slate-900">
                          {Math.round(
                            salesMetrics.annual_demand
                          ).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">
                          Projected annual demand
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {eoqData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-6 hover:shadow-lg transition-shadow">
              <p className="text-slate-600 text-sm font-medium mb-1">
                EOQ Quantity
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {Math.round(eoqData.eoq_quantity).toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Suggested optimal units per order
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md border-l-4 border-yellow-500 p-6 hover:shadow-lg transition-shadow">
              <p className="text-slate-600 text-sm font-medium mb-1">
                Reorder Point
              </p>
              <p className="text-3xl font-bold text-yellow-600">
                {Math.round(eoqData.reorder_point).toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Stock level to trigger reorder
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 p-6 hover:shadow-lg transition-shadow">
              <p className="text-slate-600 text-sm font-medium mb-1">
                Annual Total Cost
              </p>
              <p className="text-3xl font-bold text-green-600">
                ₱{Math.round(eoqData.total_annual_cost).toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Estimated yearly holding + ordering
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md border-l-4 border-red-500 p-6 hover:shadow-lg transition-shadow">
              <p className="text-slate-600 text-sm font-medium mb-1">
                Safety Stock
              </p>
              <p className="text-3xl font-bold text-red-600">
                {Math.round(eoqData.safety_stock).toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Buffer to reduce stockouts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Annual Holding Cost
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                ₱{Math.round(eoqData.annual_holding_cost)}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Cost to store inventory
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Max Stock Level
              </h3>
              <p className="text-3xl font-bold text-purple-600">
                {Math.round(eoqData.max_stock_level)} units
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Maximum inventory level
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Average Inventory
              </h3>
              <p className="text-3xl font-bold text-indigo-600">
                {Math.round(eoqData.average_inventory)} units
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Expected average stock
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Inventory Level Prediction ({inventoryTimeframe || "Monthly"})
                </h3>
              </div>
              {eoqData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={inventoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="maxStock"
                      stroke="#10b981"
                      fill="#d1fae5"
                      name="Max Stock"
                      opacity={0.3}
                    />
                    <Line
                      type="monotone"
                      dataKey="current"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Current Stock"
                    />
                    <Line
                      type="monotone"
                      dataKey="reorderPoint"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Reorder Point"
                    />
                    <Line
                      type="monotone"
                      dataKey="minStock"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Min Stock"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : inventoryAnalytics && inventoryAnalytics.length > 0 ? (
                // Fallback chart generated from inventory analytics average usage
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart
                    data={Array.from({ length: 30 }, (_, i) => ({
                      day: i + 1,
                      current: Math.max(
                        0,
                        (inventoryAnalytics[0].avg_daily_usage || 0) * (30 - i)
                      ),
                      avgDaily: inventoryAnalytics[0].avg_daily_usage || 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="current"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgDaily"
                      stroke="#10b981"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      name="Avg Daily"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No inventory analytics available yet. Import sales data to
                  generate predictions.
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Top Products — Sales vs. Avg Daily
                </h3>
              </div>
              <div className="mb-4 text-sm text-slate-600">
                This chart shows total units sold (last period) and average
                daily rate for the top products so you can spot fast movers.
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={derivedTopProducts} margin={{ left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product_name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === "total_sold") return [value, "Total Sold"];
                      if (name === "monthly_estimate")
                        return [Number(value).toLocaleString(), "Est / month"];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total_sold" fill="#3b82f6" name="Total Sold" />
                  <Bar
                    dataKey="monthly_estimate"
                    fill="#f59e0b"
                    name="Est / month"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Annual Cost Breakdown
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => `₱${Math.round(value)}`}
                  labelFormatter={(label: any) => `${label}`}
                />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Cost (₱)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {topProducts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Top Performing Products
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {topProducts.map((product, idx) => {
                  const monthly = (product.avg_daily || 0) * 30;
                  return (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium text-slate-600 truncate"
                            title={product.product_name}
                          >
                            {product.product_name}
                          </p>
                        </div>
                        <div className="text-xs font-bold text-white bg-green-600 rounded-full w-6 h-6 flex items-center justify-center">
                          {idx + 1}
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-green-700 mb-1">
                        {product.total_sold.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-600 mb-2">
                        Total Units Sold
                      </p>
                      <div className="pt-2 border-t border-green-200 space-y-1">
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold">
                            {product.avg_daily.toFixed(1)}
                          </span>{" "}
                          units/day
                        </p>
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold">
                            {monthly.toFixed(0)}
                          </span>{" "}
                          units/month
                        </p>
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold">
                            {product.transaction_count}
                          </span>{" "}
                          transactions
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {processedRestocks.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Restock Monitoring & Recommendations
                </h3>
              </div>

              {/* Immediate restock highlight */}
              {processedRestocks.length > 0 &&
                (() => {
                  const urgent = [...processedRestocks].sort(
                    (a, b) => a.daysUntilStockout - b.daysUntilStockout
                  )[0];
                  const isUrgent =
                    urgent &&
                    (urgent.priority === "high" ||
                      urgent.daysUntilStockout <= 7);
                  return isUrgent ? (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-700 font-semibold">
                            Immediate Restock Recommended
                          </p>
                          <p className="text-lg font-bold text-slate-900">
                            {urgent.product_name}
                          </p>
                          <p className="text-sm text-slate-500">
                            Days until stockout:{" "}
                            {urgent.daysUntilStockout === Infinity
                              ? "N/A"
                              : urgent.daysUntilStockout}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">
                            Recommended Qty
                          </p>
                          <p className="text-2xl font-bold text-red-600">
                            {urgent.recommendedQty.toLocaleString()} units
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

              <div className="space-y-3">
                {processedRestocks.map((rec, idx) => {
                  const urgent =
                    rec.priority === "high" || rec.daysUntilStockout <= 7;
                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border p-4 ${
                        urgent
                          ? "bg-orange-50 border-orange-200"
                          : "bg-amber-50 border-amber-100"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4
                              className="font-semibold text-slate-900 truncate"
                              title={rec.product_name}
                            >
                              {rec.product_name}
                            </h4>
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                rec.priority === "high"
                                  ? "bg-red-100 text-red-700"
                                  : rec.priority === "medium"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {rec.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">
                            {rec.recommendation}
                          </p>
                          <div className="flex gap-6 text-sm">
                            <div>
                              <p className="text-xs text-slate-500">
                                Last Total Sold
                              </p>
                              <p className="font-semibold text-slate-900">
                                {rec.last_sold_qty.toLocaleString()} units
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">
                                Daily Rate
                              </p>
                              <p className="font-semibold text-slate-900">
                                {rec.daily_rate.toFixed(2)} units/day
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">
                                Days Until Stockout
                              </p>
                              <p className="font-semibold text-slate-900">
                                {rec.daysUntilStockout === Infinity
                                  ? "N/A"
                                  : rec.daysUntilStockout}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="text-right pl-4">
                          <p className="text-xs text-slate-500">
                            Recommended Qty
                          </p>
                          <p
                            className={`text-2xl font-bold ${
                              urgent ? "text-red-600" : "text-amber-700"
                            }`}
                          >
                            {rec.recommendedQty.toLocaleString()} units
                          </p>
                          {urgent && (
                            <p className="text-xs text-red-600 mt-1">
                              Restock now
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EOQAnalyticsDashboard;
