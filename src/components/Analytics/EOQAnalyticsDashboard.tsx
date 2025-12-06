import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  ArrowLeft,
  Package,
  FileUp,
  CheckCircle,
  Upload,
  TrendingUp,
  Zap,
  AlertCircle,
  Calculator,
  RefreshCw,
  DollarSign,
  Shield,
  Coins,
  ChevronUp,
  Calendar,
  BarChart3,
  Activity,
  CalendarDays,
} from "lucide-react";
import { useTheme } from "../ThemeContext/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../Sidebar/SidebarContext";

// Get backend URL from environment variables
const PYTHON_BACKEND_URL =
  import.meta.env.VITE_PYTHON_BACKEND_URL || "http://localhost:5001";

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

interface StockDeductionItem {
  product_id: number;
  product_name: string;
  branch_id: number;
  quantity_deducted: number;
  previous_quantity: number;
  updated_quantity: number;
}

interface StockDeductionModalState {
  isOpen: boolean;
  items: StockDeductionItem[];
  totalDeducted: number;
}

const EOQAnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [eoqData, setEOQData] = useState<EOQData | null>(null);
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
  const [loadingEOQ, setLoadingEOQ] = useState(true);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    status: "loading",
    message: "",
  });
  const [stockDeductionModal, setStockDeductionModal] =
    useState<StockDeductionModalState>({
      isOpen: false,
      items: [],
      totalDeducted: 0,
    });
  const [isSalesMetricsExpanded, setIsSalesMetricsExpanded] = useState(true); // Default to expanded
  const [currentPage, setCurrentPage] = useState(1);
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

  // Fetch stock deduction details from backend
  const fetchStockDeductionDetails = useCallback(async (branchId: number) => {
    try {
      const url = new URL(
        `${PYTHON_BACKEND_URL}/api/analytics/stock-deductions`
      );
      url.searchParams.append("branch_id", branchId.toString());
      url.searchParams.append("limit", "100");

      const res = await fetch(url.toString());
      if (!res.ok) {
        console.warn(
          `Failed to fetch stock deductions: ${res.status}`,
          res.statusText
        );
        return;
      }

      const payload = await res.json();
      console.log("Stock deductions response:", payload);

      if (payload.success && Array.isArray(payload.data)) {
        const items: StockDeductionItem[] = payload.data.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product_name || `Product ${item.product_id}`,
          branch_id: item.branch_id,
          quantity_deducted: Number(item.quantity_deducted || 0),
          previous_quantity: Number(item.previous_quantity || 0),
          updated_quantity: Number(item.updated_quantity || 0),
        }));

        const totalDeducted = items.reduce(
          (sum, item) => sum + item.quantity_deducted,
          0
        );

        setStockDeductionModal({
          isOpen: true,
          items: items.slice(0, 20), // Show top 20 deductions
          totalDeducted,
        });
      }
    } catch (err) {
      console.error("Error fetching stock deductions:", err);
    }
  }, []);

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
        const branchId = user?.branch_id;
        if (branchId) {
          formData.append("branch_id", branchId.toString());
        }

        console.log("Uploading file:", file.name, "Size:", file.size);

        // Send directly to Python backend for file uploads
        // This bypasses the Node.js proxy to avoid multipart handling issues
        const response = await fetch(
          `${PYTHON_BACKEND_URL}/api/analytics/sales-data/import`,
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

          // Fetch and display stock deduction details
          if (user?.branch_id) {
            await fetchStockDeductionDetails(user.branch_id);
          }

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
          // Check if this is a negative stock error
          const isNegativeStockError =
            result.error &&
            result.error.includes("Failed analyzing and importing sales data");
          setModal({
            isOpen: true,
            status: "error",
            message: isNegativeStockError
              ? "Stock Validation Failed ⚠️"
              : "Failed to import sales data",
            details: isNegativeStockError
              ? `Cannot import sales data: ${
                  result.details || result.error
                }\n\nPlease verify that your sales quantities do not exceed current inventory levels.`
              : result.error || "Unknown error occurred",
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

  // Fetch persisted EOQ calculations from backend
  const fetchEOQCalculationsFromServer = useCallback(async () => {
    setLoadingEOQ(true);
    try {
      const branchId = user?.branch_id || null;
      const url = new URL(
        `${PYTHON_BACKEND_URL}/api/analytics/eoq-calculations?limit=50`
      );
      if (branchId) {
        url.searchParams.append("branch_id", branchId.toString());
      }

      const res = await fetch(url.toString());
      if (!res.ok) {
        console.error(
          `Failed to fetch EOQ calculations: ${res.status} ${res.statusText}`
        );
        throw new Error(`Failed to fetch EOQ calculations: ${res.status}`);
      }
      const payload = await res.json();
      console.log("EOQ calculations API response:", payload);

      if (payload.success && Array.isArray(payload.data)) {
        // Map to EOQData shape when possible
        const mapped = payload.data.map((r: any) => {
          const eoqQty = Number(r.eoq_quantity || r.eoq || 0);
          const reorderPt = Number(r.reorder_point || 0);
          const safetyStock = Number(r.safety_stock || 0);
          const annualDemand = Number(r.annual_demand || 0);

          // Calculate annual costs from stored values
          // Database stores 'holding_cost' (per-unit per-year) and 'ordering_cost' (per order)
          // annual_holding_cost = (eoq / 2) * holding_cost
          // annual_ordering_cost = (annual_demand / eoq) * ordering_cost
          let annualHoldingCost = Number(r.annual_holding_cost || 0);
          let annualOrderingCost = Number(r.annual_ordering_cost || 0);

          // If annual costs not present, calculate from stored per-unit/per-order costs
          if (!annualHoldingCost && eoqQty > 0) {
            const holdingCost = Number(r.holding_cost || 50);
            annualHoldingCost = (eoqQty / 2) * holdingCost;
          }

          if (!annualOrderingCost && eoqQty > 0 && annualDemand > 0) {
            const orderingCost = Number(r.ordering_cost || 100);
            annualOrderingCost = (annualDemand / eoqQty) * orderingCost;
          }

          // Calculate derived fields if not present in database
          // These formulas match the EOQCalculator logic:
          // max_stock_level = reorder_point + eoq_quantity
          // min_stock_level = safety_stock
          // average_inventory = (eoq_quantity / 2) + safety_stock
          const maxStockLevel =
            r.max_stock_level !== undefined
              ? Number(r.max_stock_level)
              : reorderPt + eoqQty;
          const minStockLevel =
            r.min_stock_level !== undefined
              ? Number(r.min_stock_level)
              : safetyStock;
          const avgInventory =
            r.average_inventory !== undefined
              ? Number(r.average_inventory)
              : eoqQty / 2 + safetyStock;

          // Total annual cost = annual holding cost + annual ordering cost
          const totalAnnualCost =
            r.total_annual_cost !== undefined
              ? Number(r.total_annual_cost)
              : annualHoldingCost + annualOrderingCost;

          return {
            eoq_quantity: eoqQty,
            reorder_point: reorderPt,
            safety_stock: safetyStock,
            annual_holding_cost: annualHoldingCost,
            total_annual_cost: totalAnnualCost,
            max_stock_level: maxStockLevel,
            min_stock_level: minStockLevel,
            average_inventory: avgInventory,
          } as EOQData;
        });
        // Always use the most recent EOQ calculation (first item, ordered by calculated_at DESC)
        // This ensures consistency on page refresh
        if (mapped.length > 0) {
          console.log("Setting EOQ data from database:", mapped[0]);
          setEOQData(mapped[0]);
        } else {
          console.warn(
            "No EOQ calculations found in database. Dashboard will not display until data is available."
          );
        }
      } else {
        console.warn(
          "Invalid payload structure from EOQ calculations API:",
          payload
        );
      }
    } catch (err) {
      console.error("Error fetching EOQ calculations:", err);
      // Log the full error for debugging
      if (err instanceof Error) {
        console.error("Error details:", err.message, err.stack);
      }
    } finally {
      setLoadingEOQ(false);
    }
  }, [user?.branch_id]);

  const calculateEOQWithData = useCallback(
    async (demandValue: number) => {
      try {
        // Send directly to Python backend to avoid Node.js proxy issues
        const response = await fetch(
          `${PYTHON_BACKEND_URL}/api/analytics/eoq/calculate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_id: 1,
              branch_id: user?.branch_id || 1,
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
          // Refresh the persisted calculations from database to ensure consistency
          // This ensures the data is available on page refresh
          try {
            await fetchEOQCalculationsFromServer();
          } catch (err) {
            console.warn(
              "Failed to refresh EOQ calculations after calculation",
              err
            );
          }
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
    },
    [user?.branch_id, fetchEOQCalculationsFromServer]
  );

  const fetchTopProductsFromServer = useCallback(
    async (days = 30) => {
      try {
        const branchId = user?.branch_id || null;
        const url = new URL(
          `${PYTHON_BACKEND_URL}/api/analytics/top-products?days=${days}&limit=10`
        );
        if (branchId) {
          url.searchParams.append("branch_id", branchId.toString());
        }

        const res = await fetch(url.toString());
        if (!res.ok)
          throw new Error(`Failed to fetch top products: ${res.status}`);
        const payload = await res.json();
        if (payload.success && Array.isArray(payload.data)) {
          setTopProducts(payload.data.map((p: any) => normalizeTopProduct(p)));
        }
      } catch (err) {
        console.warn("Error fetching top products", err);
      }
    },
    [user?.branch_id]
  );

  // Fetch restock recommendations from backend
  const fetchRestockRecommendationsFromServer = useCallback(async () => {
    try {
      const branchId = user?.branch_id || null;
      const url = new URL(
        `${PYTHON_BACKEND_URL}/api/analytics/restock-recommendations`
      );
      if (branchId) {
        url.searchParams.append("branch_id", branchId.toString());
      }

      console.log("Fetching restock recommendations from:", url.toString());
      const res = await fetch(url.toString());
      if (!res.ok) {
        console.warn(`Failed to fetch restock recommendations: ${res.status}`);
        return;
      }
      const payload = await res.json();
      console.log("Restock recommendations API response:", payload);

      if (payload.success && Array.isArray(payload.data)) {
        // Map restock recommendations from database
        const recommendations: RestockRecommendation[] = payload.data.map(
          (item: any) => normalizeRestock(item)
        );
        console.log("Mapped recommendations:", recommendations);
        if (recommendations.length > 0) {
          setRestockRecommendations(recommendations);
          console.log(
            "✓ Loaded restock recommendations:",
            recommendations.length
          );
        } else {
          console.log("No recommendations after mapping");
        }
      } else {
        console.warn("Invalid payload structure or no success flag:", payload);
      }
    } catch (err) {
      console.error("Error fetching restock recommendations:", err);
    }
  }, [user?.branch_id]);

  const fetchInventoryAnalyticsFromServer = useCallback(
    async (days = 30) => {
      try {
        const branchId = user?.branch_id || null;
        const url = new URL(
          `${PYTHON_BACKEND_URL}/api/analytics/inventory-analytics?days=${days}&limit=50`
        );
        if (branchId) {
          url.searchParams.append("branch_id", branchId.toString());
        }

        const res = await fetch(url.toString());
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
    },
    [user?.branch_id]
  );

  // Fetch sales summary from backend
  const fetchSalesSummaryFromServer = useCallback(
    async (days = 30) => {
      try {
        const branchId = user?.branch_id || null;
        const url = new URL(
          `${PYTHON_BACKEND_URL}/api/analytics/sales-summary?days=${days}`
        );
        if (branchId) {
          url.searchParams.append("branch_id", branchId.toString());
        }

        const res = await fetch(url.toString());
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
    },
    [user?.branch_id]
  );

  // Fetch persisted data on mount and when branch changes
  useEffect(() => {
    if (user) {
      fetchSalesSummaryFromServer();
      fetchEOQCalculationsFromServer();
      fetchTopProductsFromServer();
      fetchInventoryAnalyticsFromServer();
      fetchRestockRecommendationsFromServer();
    }
  }, [
    user?.branch_id,
    fetchSalesSummaryFromServer,
    fetchEOQCalculationsFromServer,
    fetchTopProductsFromServer,
    fetchInventoryAnalyticsFromServer,
    fetchRestockRecommendationsFromServer,
  ]);

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
    const leadTimeDays = 7;
    const daily = rec.daily_rate || 0.001;
    const daysUntilStockout = daily > 0 ? rec.last_sold_qty / daily : Infinity;

    // Calculate per-product EOQ based on demand
    // EOQ = sqrt((2 * D * S) / H)
    // Where D = annual demand, S = ordering cost, H = holding cost
    const annualDemand = daily * 365; // Convert daily rate to annual
    const orderingCost = 100; // Default ordering cost per order
    const holdingCost = 50; // Default holding cost per unit per year
    const perProductEOQ = Math.sqrt(
      (2 * annualDemand * orderingCost) / holdingCost
    );

    // Safety stock based on demand variability
    const safetyStock = Math.ceil(daily * 7); // 7 days of safety stock

    // Recommend enough for lead time + safety stock, but at least the product's EOQ
    const baseNeeded = Math.ceil(daily * leadTimeDays + safetyStock);
    const recommendedQty = Math.max(
      baseNeeded - Math.ceil(rec.last_sold_qty),
      Math.ceil(perProductEOQ)
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
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 dark:bg-gray-900/70 min-h-screen `}
    >
      <div className="gap-6">
        {modal.isOpen && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-8">
              {modal.status === "loading" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 dark:border-t-blue-400 dark:border-r-blue-400 animate-spin"></div>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {modal.message}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-gray-300 text-center">
                    {modal.details}
                  </p>
                </div>
              )}

              {modal.status === "success" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {modal.message}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-gray-300 text-center">
                    {modal.details}
                  </p>
                </div>
              )}

              {modal.status === "error" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white text-center">
                    {modal.message}
                  </h2>
                  <div className="w-full max-h-48 overflow-y-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-slate-600 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {modal.details}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setModal((prev) => ({ ...prev, isOpen: false }))
                    }
                    className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stock Deduction Modal */}
        {stockDeductionModal.isOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Stock Updated Successfully!
                    </h2>
                    <p className="text-sm text-green-50">
                      {stockDeductionModal.items.length} product
                      {stockDeductionModal.items.length !== 1 ? "s" : ""}{" "}
                      updated
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setStockDeductionModal((prev) => ({
                      ...prev,
                      isOpen: false,
                    }))
                  }
                  className="text-white hover:text-green-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Summary Stats */}
              <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-green-200 dark:border-green-900/30">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white/50 dark:bg-white/10 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide font-semibold mb-1">
                      Total Units Deducted
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stockDeductionModal.totalDeducted}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-white/10 rounded-lg border-l border-r border-green-200 dark:border-green-900/30">
                    <p className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide font-semibold mb-1">
                      Products Updated
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stockDeductionModal.items.length}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-white/10 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide font-semibold mb-1">
                      Avg Per Product
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stockDeductionModal.items.length > 0
                        ? Math.round(
                            stockDeductionModal.totalDeducted /
                              stockDeductionModal.items.length
                          )
                        : 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="overflow-y-auto flex-1">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stockDeductionModal.items.map((item, index) => (
                    <div
                      key={`${item.product_id}-${index}`}
                      className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                            {item.product_name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                              ID: {item.product_id}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                              Branch: {item.branch_id}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="mb-2">
                            <span className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-semibold">
                              -{item.quantity_deducted} units
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="text-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Before
                              </p>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {item.previous_quantity}
                              </p>
                            </div>
                            <div className="text-gray-400 dark:text-gray-500">
                              →
                            </div>
                            <div className="text-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                After
                              </p>
                              <p className="font-semibold text-green-600 dark:text-green-400">
                                {item.updated_quantity}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() =>
                    setStockDeductionModal((prev) => ({
                      ...prev,
                      isOpen: false,
                    }))
                  }
                  className="px-6 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() =>
                    setStockDeductionModal((prev) => ({
                      ...prev,
                      isOpen: false,
                    }))
                  }
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft size={26} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                EOQ Analytics Dashboard
              </h1>
              <p className="text-base text-slate-600 dark:text-gray-400 mt-1">
                Predictive Analytics for Inventory Optimization
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileUp className="w-6 h-6" />
              <span>Import Sales Data from POS</span>
            </h2>
          </div>

          <div className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
                    <span className="text-blue-800 dark:text-blue-200 font-medium">
                      Note:
                    </span>
                    <p className="text-blue-700 dark:text-blue-300">
                      Upload sales data with columns:{" "}
                      <code className="bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded text-blue-900 dark:text-blue-100 font-mono">
                        quantity
                      </code>{" "}
                      and{" "}
                      <code className="bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded text-blue-900 dark:text-blue-100 font-mono">
                        date
                      </code>
                    </p>
                  </div>
                </div>
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
                  className="px-6 py-3 rounded-2xl 
                shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)]
                dark:shadow-[6px_6px_12px_rgba(0,0,0,0.7),-6px_-6px_12px_rgba(60,60,60,0.6)]
                hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.15),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]
                dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.85),inset_-6px_-6px_12px_rgba(70,70,70,0.7)]
                hover:scale-[1.05] active:scale-95
                transition-all duration-300 text-lg font-semibold
                bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900
                text-green-600 dark:text-green-400
                flex items-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-green-600 dark:text-green-400" />
                  {uploading ? "Uploading..." : "Select CSV or Excel File"}
                </button>
              </div>

              {salesMetrics && salesMetrics.total_quantity > 0 && (
                <div className="bg-white/80 dark:bg-gray-900/70 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-tr from-green-500/20 to-green-700/20 dark:from-green-800/30 dark:to-green-600/30 mt-0.5 flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-xl">
                          Sales Data Analyzed
                        </h3>
                        <button
                          onClick={() =>
                            setIsSalesMetricsExpanded(!isSalesMetricsExpanded)
                          }
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label={
                            isSalesMetricsExpanded
                              ? "Collapse sales metrics"
                              : "Expand sales metrics"
                          }
                        >
                          <ChevronUp
                            className={`w-5 h-5 text-slate-600 dark:text-gray-400 transition-transform duration-300 ${
                              !isSalesMetricsExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-base text-slate-600 dark:text-gray-400 mb-4">
                        Data range: {salesMetrics.date_range?.start || "-"} to{" "}
                        {salesMetrics.date_range?.end || "-"}
                      </p>

                      {isSalesMetricsExpanded && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 relative">
                            <Calendar className="absolute top-3 right-3 w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <p className="text-slate-700 dark:text-gray-300 font-medium mb-1">
                              Days of Data
                            </p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                              {salesMetrics.days_of_data}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-gray-400">
                              Number of days in file
                            </p>
                          </div>

                          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 relative">
                            <TrendingUp className="absolute top-3 right-3 w-5 h-5 text-green-600 dark:text-green-400" />
                            <p className="text-slate-700 dark:text-gray-300 font-medium mb-1">
                              Monthly Projection
                            </p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                              {monthlyProjection !== null
                                ? monthlyProjection.toLocaleString()
                                : "-"}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-gray-400">
                              Estimated units / month (avg_daily × 30)
                            </p>
                          </div>

                          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 relative">
                            <BarChart3 className="absolute top-3 right-3 w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <p className="text-slate-700 dark:text-gray-300 font-medium mb-1">
                              Monthly (from total)
                            </p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                              {monthlyFromTotal !== null
                                ? monthlyFromTotal.toLocaleString()
                                : "-"}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-gray-400">
                              Total quantity ÷ months in file
                            </p>
                          </div>

                          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 relative">
                            <Package className="absolute top-3 right-3 w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <p className="text-slate-700 dark:text-gray-300 font-medium mb-1">
                              Total Quantity
                            </p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                              {Math.round(
                                salesMetrics.total_quantity
                              ).toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-gray-400">
                              Units sold in file
                            </p>
                          </div>

                          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 relative">
                            <Activity className="absolute top-3 right-3 w-5 h-5 text-teal-600 dark:text-teal-400" />
                            <p className="text-slate-700 dark:text-gray-300 font-medium mb-1">
                              Average Daily
                            </p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                              {salesMetrics.average_daily.toFixed(2)}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-gray-400">
                              Avg units sold per day
                            </p>
                          </div>

                          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 relative">
                            <CalendarDays className="absolute top-3 right-3 w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <p className="text-slate-700 dark:text-gray-300 font-medium mb-1">
                              Annual Demand
                            </p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                              {Math.round(
                                salesMetrics.annual_demand
                              ).toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-gray-400">
                              Projected annual demand
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!loadingEOQ &&
                (!salesMetrics || salesMetrics.total_quantity === 0) && (
                  <div className="bg-white/80 dark:bg-gray-900/70 rounded-2xl shadow-md border border-amber-200 dark:border-amber-700/30 p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-700/20 dark:from-amber-800/30 dark:to-amber-600/30 mt-0.5 flex-shrink-0">
                        <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-xl">
                          No Sales Data Has Been Analyzed
                        </h3>
                        <p className="text-base text-slate-600 dark:text-gray-400">
                          Upload a CSV or Excel file with sales data containing{" "}
                          <code className="bg-amber-100 dark:bg-amber-800/50 px-2 py-1 rounded text-amber-900 dark:text-amber-100 font-mono">
                            quantity
                          </code>{" "}
                          and{" "}
                          <code className="bg-amber-100 dark:bg-amber-800/50 px-2 py-1 rounded text-amber-900 dark:text-amber-100 font-mono">
                            date
                          </code>{" "}
                          columns to get started with EOQ analysis.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {loadingEOQ && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-slate-200 dark:border-gray-700 p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 dark:border-t-blue-400 dark:border-r-blue-400 animate-spin"></div>
              </div>
              <p className="text-base text-slate-600 dark:text-gray-400">
                Loading EOQ data...
              </p>
            </div>
          </div>
        )}

        {!loadingEOQ && !eoqData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-slate-200 dark:border-gray-700 p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-slate-400 dark:text-gray-500" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                No EOQ Data Available
              </h3>
              <p className="text-base text-slate-600 dark:text-gray-400 max-w-md">
                Upload sales data to calculate EOQ metrics. The dashboard will
                display once calculations are available.
              </p>
            </div>
          </div>
        )}

        {!loadingEOQ && eoqData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mt-6 mb-6 gap-4">
              <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative">
                <Calculator className="absolute top-4 right-4 w-6 h-6 text-blue-600 dark:text-blue-400" />
                <p className="text-slate-600 dark:text-gray-400 font-medium mb-1">
                  EOQ Quantity
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(eoqData.eoq_quantity).toLocaleString()}
                </p>
                <p className="text-slate-500 dark:text-gray-500 text-sm mt-2">
                  Suggested optimal units per order
                </p>
              </div>

              <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative">
                <RefreshCw className="absolute top-4 right-4 w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <p className="text-slate-600 dark:text-gray-400 font-medium mb-1">
                  Reorder Point
                </p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {Math.round(eoqData.reorder_point).toLocaleString()}
                </p>
                <p className="text-slate-500 dark:text-gray-500 text-sm mt-2">
                  Stock level to trigger reorder
                </p>
              </div>

              <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative">
                <Coins className="absolute top-4 right-4 w-6 h-6 text-green-600 dark:text-green-400" />
                <p className="text-slate-600 dark:text-gray-400 font-medium mb-1">
                  Annual Total Cost
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  PHP{" "}
                  {Math.round(eoqData.total_annual_cost).toLocaleString(
                    "en-US",
                    { minimumFractionDigits: 2 }
                  )}
                </p>
                <p className="text-slate-500 dark:text-gray-500 text-sm mt-2">
                  Estimated yearly holding + ordering
                </p>
              </div>

              <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative">
                <Shield className="absolute top-4 right-4 w-6 h-6 text-red-600 dark:text-red-400" />
                <p className="text-slate-600 dark:text-gray-400 font-medium mb-1">
                  Safety Stock
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {Math.round(eoqData.safety_stock).toLocaleString()}
                </p>
                <p className="text-slate-500 dark:text-gray-500 text-sm mt-2">
                  Buffer to reduce stockouts
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative">
                <Coins className="absolute top-4 right-4 w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-lg">
                  Annual Holding Cost
                </h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  PHP{" "}
                  {Math.round(eoqData.annual_holding_cost).toLocaleString(
                    "en-US",
                    { minimumFractionDigits: 2 }
                  )}
                </p>
                <p className="text-slate-500 dark:text-gray-500 text-base mt-2">
                  Cost to store inventory
                </p>
              </div>
              <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative">
                <TrendingUp className="absolute top-4 right-4 w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-lg">
                  Max Stock Level
                </h3>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(eoqData.max_stock_level)} units
                </p>
                <p className="text-slate-500 dark:text-gray-500 text-base mt-2">
                  Maximum inventory level
                </p>
              </div>
              <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative">
                <Package className="absolute top-4 right-4 w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-lg">
                  Average Inventory
                </h3>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(eoqData.average_inventory)} units
                </p>
                <p className="text-slate-500 dark:text-gray-500 text-base mt-2">
                  Expected average stock
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 mt-6 gap-6">
              {/* Inventory Level Prediction */}
              <div className="bg-white/80 dark:bg-gray-900/70 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-500/20 to-blue-700/20 dark:from-blue-800/30 dark:to-blue-600/30">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Inventory Level Prediction (
                    {inventoryTimeframe || "Monthly"})
                  </h3>
                </div>
                {eoqData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={inventoryData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDarkMode ? "#4b5563" : "#e5e7eb"}
                      />
                      <XAxis
                        dataKey="day"
                        stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
                      />
                      <YAxis stroke={isDarkMode ? "#9ca3af" : "#6b7280"} />
                      <Tooltip
                        contentStyle={
                          isDarkMode
                            ? {
                                backgroundColor: "#1f2937",
                                borderColor: "#374151",
                                color: "#f9fafb",
                              }
                            : {}
                        }
                      />
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
                          (inventoryAnalytics[0].avg_daily_usage || 0) *
                            (30 - i)
                        ),
                        avgDaily: inventoryAnalytics[0].avg_daily_usage || 0,
                      }))}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDarkMode ? "#4b5563" : "#e5e7eb"}
                      />
                      <XAxis
                        dataKey="day"
                        stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
                      />
                      <YAxis stroke={isDarkMode ? "#9ca3af" : "#6b7280"} />
                      <Tooltip
                        contentStyle={
                          isDarkMode
                            ? {
                                backgroundColor: "#1f2937",
                                borderColor: "#374151",
                                color: "#f9fafb",
                              }
                            : {}
                        }
                      />
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
                  <div className="p-8 text-center text-slate-500 dark:text-gray-400">
                    No inventory analytics available yet. Import sales data to
                    generate predictions.
                  </div>
                )}
              </div>
              {/* Top Products — Sales vs. Avg Daily */}
              <div className="bg-white/80 dark:bg-gray-900/70 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-500/20 to-purple-700/20 dark:from-purple-800/30 dark:to-purple-600/30">
                    <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Top Products — Sales vs. Avg Daily
                  </h3>
                </div>
                <div className="mb-4 text-base text-slate-600 dark:text-gray-400">
                  This chart shows total units sold (last period) and average
                  daily rate for the top products so you can spot fast movers.
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={derivedTopProducts} margin={{ left: -8 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDarkMode ? "#4b5563" : "#e5e7eb"}
                    />
                    <XAxis
                      dataKey="product_name"
                      tick={{ fontSize: 12 }}
                      stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
                    />
                    <YAxis stroke={isDarkMode ? "#9ca3af" : "#6b7280"} />
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        if (name === "total_sold") return [value, "Total Sold"];
                        if (name === "monthly_estimate")
                          return [
                            Number(value).toLocaleString(),
                            "Est / month",
                          ];
                        return [value, name];
                      }}
                      contentStyle={
                        isDarkMode
                          ? {
                              backgroundColor: "#1f2937",
                              borderColor: "#374151",
                              color: "#f9fafb",
                            }
                          : {}
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="total_sold"
                      fill="#3b82f6"
                      name="Total Sold"
                    />
                    <Bar
                      dataKey="monthly_estimate"
                      fill="#f59e0b"
                      name="Est / month"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/70 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-yellow-500/20 to-yellow-700/20 dark:from-yellow-800/30 dark:to-yellow-600/30">
                  <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Annual Cost Breakdown
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDarkMode ? "#4b5563" : "#e5e7eb"}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
                  />
                  <YAxis stroke={isDarkMode ? "#9ca3af" : "#6b7280"} />
                  <Tooltip
                    formatter={(value: any) => `₱${Math.round(value)}`}
                    labelFormatter={(label: any) => `${label}`}
                    contentStyle={
                      isDarkMode
                        ? {
                            backgroundColor: "#1f2937",
                            borderColor: "#374151",
                            color: "#f9fafb",
                          }
                        : {}
                    }
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Cost (₱)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {topProducts.length > 0 && (
              <div className="bg-white/80 dark:bg-gray-900/70 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all mt-6 duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Top Performing Products
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-2 text-slate-600 dark:text-gray-400 font-semibold text-base">
                          Product
                        </th>
                        <th className="text-center py-3 px-2 text-slate-600 dark:text-gray-400 font-semibold text-base">
                          Units Sold
                        </th>
                        <th className="text-center py-3 px-2 text-slate-600 dark:text-gray-400 font-semibold text-base">
                          Units/Day
                        </th>
                        <th className="text-center py-3 px-2 text-slate-600 dark:text-gray-400 font-semibold text-base">
                          Units/Month
                        </th>
                        <th className="text-center py-3 px-2 text-slate-600 dark:text-gray-400 font-semibold text-base">
                          Transactions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product, idx) => {
                        const monthly = (product.avg_daily || 0) * 30;
                        return (
                          <tr
                            key={idx}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50/70 dark:hover:bg-blue-900/30 transition-colors duration-200"
                          >
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-bold text-white bg-gradient-to-tr from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                                  {idx + 1}
                                </div>
                                <span
                                  className="text-slate-800 dark:text-gray-200 font-medium truncate max-w-xs"
                                  title={product.product_name}
                                >
                                  {product.product_name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="text-[#222222] dark:text-[#F1F1F1] font-semibold">
                                {product.total_sold.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center text-[#222222] dark:text-[#F1F1F1]">
                              {product.avg_daily.toFixed(1)}
                            </td>
                            <td className="py-3 px-2 text-center text-[#222222] dark:text-[#F1F1F1]">
                              {monthly.toFixed(0)}
                            </td>
                            <td className="py-3 px-2 text-center text-[#222222] dark:text-[#F1F1F1]">
                              {product.transaction_count}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {processedRestocks.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-slate-200 dark:border-gray-700 p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
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
                      <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base text-red-700 dark:text-red-400 font-semibold">
                              Immediate Restock Recommended
                            </p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">
                              {urgent.product_name}
                            </p>
                            <p className="text-base text-slate-500 dark:text-gray-400">
                              Days until stockout:{" "}
                              {urgent.daysUntilStockout === Infinity
                                ? "N/A"
                                : urgent.daysUntilStockout}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-base text-slate-500 dark:text-gray-400">
                              Recommended Qty
                            </p>
                            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                              {urgent.recommendedQty.toLocaleString()} units
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                {/* Pagination calculations */}
                {(() => {
                  const itemsPerPage = 5;
                  const indexOfLastItem = currentPage * itemsPerPage;
                  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                  const currentItems = processedRestocks.slice(
                    indexOfFirstItem,
                    indexOfLastItem
                  );
                  const totalPages = Math.ceil(
                    processedRestocks.length / itemsPerPage
                  );

                  return (
                    <div>
                      <div className="space-y-3">
                        {currentItems.map((rec, idx) => {
                          const urgent =
                            rec.priority === "high" ||
                            rec.daysUntilStockout <= 7;
                          return (
                            <div
                              key={idx}
                              className={`rounded-lg border p-4 ${
                                urgent
                                  ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50"
                                  : "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4
                                      className="font-semibold text-slate-900 dark:text-white truncate text-lg"
                                      title={rec.product_name}
                                    >
                                      {rec.product_name}
                                    </h4>
                                    <span
                                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        rec.priority === "high"
                                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                          : rec.priority === "medium"
                                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                      }`}
                                    >
                                      {rec.priority.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-base text-slate-600 dark:text-gray-400 mb-2">
                                    {rec.recommendation}
                                  </p>
                                  <div className="flex gap-6 text-base">
                                    <div>
                                      <p className="text-sm text-slate-500 dark:text-gray-500">
                                        Last Total Sold
                                      </p>
                                      <p className="font-semibold text-slate-900 dark:text-white text-lg">
                                        {rec.last_sold_qty.toLocaleString()}{" "}
                                        units
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-slate-500 dark:text-gray-500">
                                        Daily Rate
                                      </p>
                                      <p className="font-semibold text-slate-900 dark:text-white text-lg">
                                        {rec.daily_rate.toFixed(2)} units/day
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-slate-500 dark:text-gray-500">
                                        Days Until Stockout
                                      </p>
                                      <p className="font-semibold text-slate-900 dark:text-white text-lg">
                                        {rec.daysUntilStockout === Infinity
                                          ? "N/A"
                                          : rec.daysUntilStockout}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right pl-4">
                                  <p className="text-sm text-slate-500 dark:text-gray-500">
                                    Recommended Qty
                                  </p>
                                  <p
                                    className={`text-3xl font-bold ${
                                      urgent
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-amber-700 dark:text-amber-500"
                                    }`}
                                  >
                                    {rec.recommendedQty.toLocaleString()} units
                                  </p>
                                  {urgent && (
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                      Restock now
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-end mt-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                              }
                              disabled={currentPage === 1}
                              className={`px-4 py-2 rounded-lg font-medium ${
                                currentPage === 1
                                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                  : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                              }`}
                            >
                              Previous
                            </button>

                            <div className="flex items-center space-x-1">
                              {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                              ).map((page) => (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`w-10 h-10 rounded-full ${
                                    currentPage === page
                                      ? "bg-blue-500 text-white"
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                  }`}
                                >
                                  {page}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(prev + 1, totalPages)
                                )
                              }
                              disabled={currentPage === totalPages}
                              className={`px-4 py-2 rounded-lg font-medium ${
                                currentPage === totalPages
                                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                  : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                              }`}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EOQAnalyticsDashboard;
