import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Upload,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  ArrowLeft,
  Download,
  Package,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";
import { useCategories } from "../../hooks/useOptimizedFetch";
import { api } from "../../utils/apiClient";
import { useErrorHandler } from "../../utils/errorHandler";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../Sidebar/SidebarContext";

interface Product {
  id: number;
  branch_id: number;
  name: string;
  category: number;
  category_name?: string;
  price: string;
  stock: number;
  status: "In Stock" | "Out of Stock" | "Low Stock";
  detailsPage?: string;
  source?: "Local" | "Transferred";
  transferred_from?: string;
  transferred_at?: string;
  request_id?: number;
  transferTag?: string | null;
  transferTagAppliedAt?: string | null;
  quantityAdded?: number; // Quantity added during transfer
  previousQuantity?: number; // Previous quantity before transfer
}

const STATUS_OPTIONS: ("In Stock" | "Out of Stock" | "Low Stock")[] = [
  "In Stock",
  "Low Stock",
  "Out of Stock",
];

// Memoized status component
const ProductStatus = memo(({ status }: { status: string }) => (
  <span
    className={`px-1 py-1 rounded-full text-xs  ${
      status === "In Stock"
        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
        : status === "Low Stock"
        ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
        : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
    }`}
  >
    {status}
  </span>
));

ProductStatus.displayName = "ProductStatus";

// Memoized product row component
const ProductRow = memo(
  ({
    product,
    categories,
    selectedProducts,
    onToggleSelection,
    onEdit,
    onDelete,
    branchId,
  }: {
    product: Product;
    categories: Array<{ id: number; category_name: string }>;
    selectedProducts: number[];
    onToggleSelection: (id: number) => void;
    onEdit: (product: Product) => void;
    onDelete: (id: number) => void;
    branchId: number | null;
  }) => {
    const categoryName = useMemo(
      () =>
        categories.find((cat) => Number(cat.id) === product.category)
          ?.category_name || "Unknown",
      [categories, product.category]
    );

    return (
      <tr className="hover:bg-gray-50 dark:hover:bg-neutral-700">
        <td className="px-4 py-2">
          <input
            type="checkbox"
            checked={selectedProducts.includes(product.id)}
            onChange={() => onToggleSelection(product.id)}
            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </td>
        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 font-mono">
          {`${product.branch_id || branchId || "N/A"}-${String(
            product.id
          ).padStart(4, "0")}`}
        </td>
        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 relative cursor-pointer">
          <span>{product.name}</span>
        </td>
        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
          {categoryName}
        </td>
        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
          Php {product.price}
        </td>
        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
          {product.stock}
        </td>
        <td className="px-4 py-2 text-sm font-medium">
          <ProductStatus status={product.status} />
        </td>
        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
              className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product.id);
              }}
              className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }
);

ProductRow.displayName = "ProductRow";

// Memoized pagination component
const Pagination = memo(
  ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,

    indexOfFirstItem,
    indexOfLastItem,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
    indexOfFirstItem: number;
    indexOfLastItem: number;
  }) => {
    // Always show pagination controls, even with fewer than 10 items
    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 dark:bg-gray-900/70 border-t border-gray-200 dark:border-neutral-600 sm:px-6">
        <div className="flex items-center">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(indexOfLastItem, totalItems)}
            </span>
            {""}
            of <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div>
          <div
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm font-medium ${
                currentPage === 1
                  ? "text-gray-300 dark:text-neutral-500 cursor-not-allowed"
                  : "text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-600"
              }`}
            >
              <span className="sr-only">Previous</span>
              &larr;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  currentPage === page
                    ? "z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-300"
                    : "bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-600"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() =>
                onPageChange(Math.min(currentPage + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm font-medium ${
                currentPage === totalPages
                  ? "text-gray-300 dark:text-neutral-500 cursor-not-allowed"
                  : "text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-600"
              }`}
            >
              <span className="sr-only">Next</span>
              &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }
);

Pagination.displayName = "Pagination";

function OptimizedAllStock() {
  const { isCollapsed } = useSidebar();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { handleError } = useErrorHandler();
  const { user: currentUser } = useAuth();

  const [branchId, setBranchId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] =
    useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(0);
  // Initialize status from URL parameter, fallback to "All"
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get("status") || "All"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Update status filter when URL parameter changes
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam && ["Low Stock", "Out of Stock", "In Stock"].includes(statusParam)) {
      setSelectedStatus(statusParam);
    } else if (!statusParam) {
      // If status param is removed, reset to "All"
      setSelectedStatus("All");
    }
  }, [searchParams]);

  // Get branch ID from current user's profile
  useEffect(() => {
    if (currentUser?.branch_id) {
      setBranchId(currentUser.branch_id);
    } else {
      // If user doesn't have a branch_id, show error
      setProductsError(
        "User is not assigned to any branch. Please contact administrator."
      );
      setIsLoading(false);
    }
  }, [currentUser]);

  // State for products and loading
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Use optimized hook for categories
  const { data: categoriesData, error: categoriesError } = useCategories() as {
    data: Array<{ id: number; category_name: string }> | null;
    error: string | null;
    isLoading: boolean;
  };

  // Ensure categories is always an array
  const categories = categoriesData || [];

  // Enhanced product fetching with transfer tracking
  const fetchProducts = useCallback(async () => {
    if (!branchId) return;

    try {
      setIsLoading(true);
      setProductsError(null);

      // Fetch products from the user's branch
      // Use getProducts instead of getBranchProducts to include products with quantity = 0
      const { data: branchProducts, error: branchError } =
        await api.getProducts(branchId);

      if (branchError) {
        throw new Error(branchError);
      }

      // Map branch products (these are all products currently in the user's branch)
      // Note: getProducts endpoint doesn't include transfer_tag fields, but we'll get them from audit logs
      const mappedProducts = (branchProducts as any[]).map((product: any) => ({
        id: product.id,
        branch_id: branchId, // Use the branchId from the API call since it's not in the response
        name: product.product_name,
        category: product.category_id,
        category_name: product.category_name,
        price: Number(product.price).toFixed(2),
        stock: product.quantity,
        status: product.status, // Use status from database instead of calculating
        detailsPage: `/product/${product.id}`,
        source: (product.transfer_tag ? "Transferred" : "Local") as const,
        transferred_from: undefined,
        transferred_at: undefined,
        request_id: undefined,
        transferTag: product.transfer_tag || null, // May be undefined from /api/products endpoint
        transferTagAppliedAt: product.transfer_tag_set_at || null, // May be undefined from /api/products endpoint
      }));

      // Fetch audit logs to identify transferred products
      if (currentUser) {
        try {
          // Fetch audit logs with a high limit to get all transfer logs
          const { data: auditLogsResponse, error: auditError } =
            await api.getUserAuditLogs(currentUser.user_id, {
              limit: 1000, // Get a large number of logs to ensure we capture all transfers
              action: "INVENTORY_TRANSFER",
            });

          // Handle paginated response - extract logs array
          const auditLogs =
            (auditLogsResponse as any)?.logs ||
            (Array.isArray(auditLogsResponse) ? auditLogsResponse : []);

          if (
            !auditError &&
            auditLogs &&
            Array.isArray(auditLogs) &&
            auditLogs.length > 0
          ) {
            // Find inventory transfer logs for this branch
            // Check for both entity types: "product_requisition" (mark as arrived) and "centralized_product" (approval)
            const transferLogs = auditLogs.filter(
              (log: any) =>
                log.action === "INVENTORY_TRANSFER" &&
                (log.entity_type === "product_requisition" ||
                  log.entity_type === "centralized_product") &&
                Number(log.metadata?.requester_branch_id) === Number(branchId)
            );

            console.log(
              "Found transfer logs:",
              transferLogs.length,
              transferLogs
            );

            // Update products that were transferred
            const updatedProducts = mappedProducts.map((product: Product) => {
              // Find the transfer log that contains this product
              const transferLog = transferLogs.find((log: any) => {
                if (Array.isArray(log.metadata?.items_merged)) {
                  return log.metadata.items_merged.some(
                    (merged: any) =>
                      Number(merged.product_id) === Number(product.id)
                  );
                }
                return (
                  log.metadata?.product_id &&
                  Number(log.metadata.product_id) === Number(product.id)
                );
              });

              if (transferLog) {
                // Find the specific merged item to get quantity details
                let quantityAdded = 0;
                let previousQuantity = 0;

                if (Array.isArray(transferLog.metadata?.items_merged)) {
                  const mergedItem = transferLog.metadata.items_merged.find(
                    (merged: any) =>
                      Number(merged.product_id) === Number(product.id)
                  );
                  if (mergedItem) {
                    // Ensure we convert to numbers
                    quantityAdded = Number(mergedItem.added_quantity) || 0;
                    previousQuantity =
                      Number(mergedItem.previous_quantity) || 0;
                    console.log(`Product ${product.id} (${product.name}):`, {
                      added_quantity: quantityAdded,
                      previous_quantity: previousQuantity,
                      mergedItem,
                    });
                  } else {
                    console.warn(
                      `No merged item found for product ${product.id} in transfer log`,
                      {
                        productId: product.id,
                        productName: product.name,
                        items_merged: transferLog.metadata?.items_merged,
                      }
                    );
                  }
                } else {
                  // Fallback for older audit logs without items_merged
                  quantityAdded = Number(transferLog.metadata?.quantity) || 0;
                  previousQuantity =
                    Number(transferLog.old_values?.quantity) || 0;
                }

                const updatedProduct = {
                  ...product,
                  source: "Transferred" as const,
                  transferred_from:
                    transferLog.metadata?.source_branch_name ||
                    "Unknown Branch",
                  transferred_at: transferLog.timestamp,
                  request_id: transferLog.metadata?.request_id,
                  quantityAdded: quantityAdded > 0 ? quantityAdded : undefined,
                  previousQuantity:
                    previousQuantity >= 0 ? previousQuantity : undefined,
                };

                console.log(`Setting product ${product.id} with:`, {
                  quantityAdded: updatedProduct.quantityAdded,
                  previousQuantity: updatedProduct.previousQuantity,
                  productName: updatedProduct.name,
                });

                return updatedProduct;
              }

              return product;
            });

            setProducts(updatedProducts);
          } else {
            setProducts(mappedProducts);
          }
        } catch (auditError) {
          console.warn(
            "Could not fetch transfer history, showing local products only:",
            auditError
          );
          setProducts(mappedProducts);
        }
      } else {
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error fetching products";
      setProductsError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [branchId, currentUser]);

  // Fetch products when branchId changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Refetch products when navigating to this page (e.g., after marking items as arrived)
  useEffect(() => {
    if (location.pathname === "/all_stock" && branchId) {
      fetchProducts();
    }
  }, [location.pathname, branchId, fetchProducts]);

  // Refetch products when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && branchId) {
        fetchProducts();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [branchId, fetchProducts]);

  // Refetch function for external use
  const refetchProducts = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Separate products into local inventory and transferred items
  const { localProducts, transferredProducts } = useMemo(() => {
    const local = products.filter((product: Product) => !product.transferTag);
    const transferred = products.filter(
      (product: Product) => product.transferTag
    );
    return { localProducts: local, transferredProducts: transferred };
  }, [products]);

  const [transferSearchTerm, setTransferSearchTerm] = useState("");
  const [transferTypeFilter, setTransferTypeFilter] = useState<
    "All" | "New" | "Updated"
  >("All");
  const [transferSortOrder, setTransferSortOrder] = useState<
    "Latest" | "Oldest"
  >("Latest");

  const getFormattedProductId = useCallback(
    (product: Product) => {
      const branchCode = product.branch_id || branchId || "N/A";
      return `${branchCode}-${String(product.id).padStart(4, "0")}`;
    },
    [branchId]
  );

  const filteredTransferredProducts = useMemo(() => {
    const filtered = transferredProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(transferSearchTerm.toLowerCase()) ||
        String(product.id).includes(transferSearchTerm) ||
        getFormattedProductId(product)
          .toLowerCase()
          .includes(transferSearchTerm.toLowerCase());

      const isNew = product.transferTag === "New Item from Transfer";
      const matchesType =
        transferTypeFilter === "All" ||
        (transferTypeFilter === "New" && isNew) ||
        (transferTypeFilter === "Updated" && !isNew);

      return matchesSearch && matchesType;
    });

    // Sort by transfer date (latest first by default)
    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.transferTagAppliedAt
        ? new Date(a.transferTagAppliedAt).getTime()
        : 0;
      const dateB = b.transferTagAppliedAt
        ? new Date(b.transferTagAppliedAt).getTime()
        : 0;

      if (transferSortOrder === "Latest") {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });

    return sorted;
  }, [
    transferredProducts,
    transferSearchTerm,
    transferTypeFilter,
    transferSortOrder,
    getFormattedProductId,
  ]);

  // Memoized filtered products (ALL products for main table - final state)
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product: Product) => {
      // First filter: Only show products from the current user's branch
      const matchesBranch = branchId ? product.branch_id === branchId : true;

      const normalizedSearch = searchTerm.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(normalizedSearch) ||
        String(product.id).toLowerCase().includes(normalizedSearch) ||
        getFormattedProductId(product).toLowerCase().includes(normalizedSearch);
      const matchesCategory =
        selectedCategory === 0 || product.category === selectedCategory;
      
      // Enhanced status matching: Check both status field and actual quantity
      // This ensures consistency with dashboard counts which are based on quantity
      let matchesStatus = true;
      if (selectedStatus !== "All") {
        // Ensure stock is a number (handle string, null, undefined)
        const stock = Number(product.stock) || 0;
        if (selectedStatus === "Out of Stock") {
          // Match if status is "Out of Stock" OR quantity is 0
          matchesStatus = product.status === "Out of Stock" || stock === 0;
        } else if (selectedStatus === "Low Stock") {
          // Match if status is "Low Stock" OR (quantity > 0 AND quantity < 20)
          matchesStatus = product.status === "Low Stock" || (stock > 0 && stock < 20);
        } else if (selectedStatus === "In Stock") {
          // Match if status is "In Stock" OR quantity >= 20
          matchesStatus = product.status === "In Stock" || stock >= 20;
        } else {
          // Fallback to exact status match for any other status values
          matchesStatus = product.status === selectedStatus;
        }
      }

      return matchesBranch && matchesSearch && matchesCategory && matchesStatus;
    });

    return filtered;
  }, [
    products,
    branchId,
    searchTerm,
    selectedCategory,
    selectedStatus,
    getFormattedProductId,
  ]);

  // Memoized pagination data
  const paginatedData = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(
      indexOfFirstItem,
      indexOfLastItem
    );
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    return {
      currentItems,
      totalPages,
      indexOfFirstItem,
      indexOfLastItem,
    };
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Memoized handlers
  const handleAddProduct = useCallback(
    async (productData: {
      name: string;
      category: number;
      price: string;
      stock: string;
      status: "In Stock" | "Out of Stock" | "Low Stock";
    }) => {
      console.log("handleAddProduct called with:", productData);
      console.log("Current branchId:", branchId);

      if (!branchId) {
        toast.error("Please select a branch first");
        return;
      }

      const payload = {
        ...productData,
        branch_id: branchId,
      };

      console.log("Sending payload to API:", payload);

      try {
        if (!currentUser) {
          toast.error("User not authenticated");
          return;
        }

        const { error } = await api.createProduct(payload, currentUser.user_id);

        if (error) {
          console.error("API error:", error);
          toast.error(error);
          return;
        }

        toast.success("Product added successfully!");
        refetchProducts();
        setIsAddModalOpen(false);
      } catch (err) {
        console.error("Exception in handleAddProduct:", err);
        const errorMessage = handleError(err, "Add product");
        toast.error(errorMessage);
      }
    },
    [branchId, refetchProducts, handleError]
  );

  const handleEditProduct = useCallback(
    async (productData: {
      id: number;
      name: string;
      category: number;
      price: string;
      stock: string;
      status: "In Stock" | "Out of Stock" | "Low Stock";
    }) => {
      try {
        if (!currentUser) {
          toast.error("User not authenticated");
          return;
        }

        const { error } = await api.updateProduct(
          productData.id,
          productData,
          currentUser.user_id
        );

        if (error) {
          toast.error(error);
          return;
        }

        toast.success("Product updated successfully!");
        refetchProducts();
        setIsEditModalOpen(false);
      } catch (err) {
        const errorMessage = handleError(err, "Update product");
        toast.error(errorMessage);
      }
    },
    [refetchProducts, handleError]
  );

  const handleDelete = useCallback(async () => {
    if (!productToDelete) return;

    try {
      if (!currentUser) {
        toast.error("User not authenticated");
        return;
      }

      const { error } = await api.deleteProduct(
        productToDelete,
        currentUser.user_id
      );

      if (error) {
        // Check if it's a 409 conflict (active requests)
        if (
          error.includes("active request") ||
          error.includes("Cannot delete product")
        ) {
          toast.error(error, { duration: 6000 });
        } else {
          toast.error(error);
        }
        return;
      }

      toast.success("Product deleted successfully!");
      refetchProducts();
      setIsDeleteModalOpen(false);
    } catch (err) {
      const errorMessage = handleError(err, "Delete product");
      toast.error(errorMessage);
    }
  }, [productToDelete, refetchProducts, handleError]);

  const handleBulkDelete = useCallback(async () => {
    try {
      if (!currentUser) {
        toast.error("User not authenticated");
        return;
      }

      // Delete products in parallel
      const deletePromises = selectedProducts.map(async (id) => {
        const result = await api.deleteProduct(id, currentUser.user_id);
        return { id, result };
      });
      const results = await Promise.allSettled(deletePromises);

      const errors = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected"
        )
        .map((result) => result.reason);

      const failedDeletes = results
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<{ id: number; result: any }> =>
            result.status === "fulfilled" && !!result.value.result.error
        )
        .map((result) => ({
          id: result.value.id,
          error: result.value.result.error,
        }));

      if (errors.length > 0 || failedDeletes.length > 0) {
        const totalFailed = errors.length + failedDeletes.length;
        const activeRequestErrors = failedDeletes.filter(
          (f) =>
            f.error.includes("active request") ||
            f.error.includes("Cannot delete product")
        );

        if (activeRequestErrors.length > 0) {
          toast.error(
            `${activeRequestErrors.length} products cannot be deleted due to active requests. Please complete or cancel the requests first.`,
            { duration: 8000 }
          );
        } else {
          toast.error(`Failed to delete ${totalFailed} products`);
        }
        return;
      }

      toast.success("Products deleted successfully!");
      refetchProducts();
      setIsBulkDeleteModalOpen(false);
      setSelectedProducts([]);
    } catch (err) {
      const errorMessage = handleError(err, "Bulk delete products");
      toast.error(errorMessage);
    }
  }, [selectedProducts, refetchProducts, handleError]);

  // Selection handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedProducts.length === paginatedData.currentItems.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(
        paginatedData.currentItems.map((product: Product) => product.id)
      );
    }
  }, [selectedProducts.length, paginatedData.currentItems]);

  const toggleProductSelection = useCallback((id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  }, []);

  // Modal handlers
  const setupEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  }, []);

  const confirmDelete = useCallback((id: number) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmBulkDelete = useCallback(() => {
    setIsBulkDeleteModalOpen(true);
  }, []);

  // Enhanced Excel import with upsert functionality (memoized)
  const handleImportExcel = useCallback(() => {
    if (categories.length === 0) {
      toast.error("Categories not loaded yet. Please try again in a moment.");
      return;
    }

    if (!branchId) {
      toast.error("Branch ID not available. Please try again.");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate Excel template format
        if (jsonData.length === 0) {
          toast.error("Excel file is empty");
          return;
        }

        const requiredColumns = [
          "Product Name",
          "Category",
          "Price",
          "Quantity",
          "Status",
        ];
        const firstRow = jsonData[0] as any;
        const hasRequiredColumns = requiredColumns.every((col) =>
          Object.keys(firstRow).includes(col)
        );

        if (!hasRequiredColumns) {
          toast.error(
            `Excel template must contain columns: ${requiredColumns.join(", ")}`
          );
          return;
        }

        // Process and validate data
        const processedData = [];
        const errors = [];

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i] as any;
          const rowNum = i + 2; // Excel row number (accounting for header)

          // Validate required fields
          if (
            !row["Product Name"] ||
            !row["Category"] ||
            !row["Price"] ||
            row["Quantity"] === undefined
          ) {
            errors.push(`Row ${rowNum}: Missing required fields`);
            continue;
          }

          // Validate data types
          const price = parseFloat(row["Price"]);
          const quantity = parseInt(row["Quantity"]);

          if (isNaN(price) || price < 0) {
            errors.push(`Row ${rowNum}: Invalid price value`);
            continue;
          }

          if (isNaN(quantity) || quantity < 0) {
            errors.push(`Row ${rowNum}: Invalid quantity value`);
            continue;
          }

          // Validate status
          const validStatuses = ["In Stock", "Out of Stock", "Low Stock"];
          if (!validStatuses.includes(row["Status"])) {
            errors.push(
              `Row ${rowNum}: Invalid status. Must be one of: ${validStatuses.join(
                ", "
              )}`
            );
            continue;
          }

          // Find category ID (case-insensitive, trim whitespace, and handle singular/plural)
          const categoryName = row["Category"].toString().trim();

          // Try exact match first
          let category = categories.find(
            (cat) =>
              cat.category_name.toLowerCase() === categoryName.toLowerCase()
          );

          // If no exact match, try singular/plural variations
          if (!category) {
            category = categories.find((cat) => {
              const dbCategory = cat.category_name.toLowerCase();
              const inputCategory = categoryName.toLowerCase();

              // Check if one is singular and other is plural
              return (
                dbCategory === inputCategory + "s" || // DB has plural, input has singular
                inputCategory === dbCategory + "s" || // Input has plural, DB has singular
                dbCategory === inputCategory.slice(0, -1) || // DB has singular, input has plural
                inputCategory === dbCategory.slice(0, -1) // Input has singular, DB has plural
              );
            });
          }

          if (!category) {
            const availableCategories = categories
              .map((cat) => cat.category_name)
              .join(", ");
            errors.push(
              `Row ${rowNum}: Category "${categoryName}" not found. Available categories: ${availableCategories}`
            );
            continue;
          }

          processedData.push({
            name: row["Product Name"],
            category: category.id,
            price: price,
            stock: quantity, // This will be added to existing quantity for updates
            status: row["Status"],
            branch_id: branchId,
          });

        }

        if (errors.length > 0) {
          const availableCategories = categories
            .map((cat) => cat.category_name)
            .join(", ");
          const errorMessage = `Validation errors found:\n${errors
            .slice(0, 5)
            .join("\n")}${
            errors.length > 5 ? "\n..." : ""
          }\n\nAvailable categories: ${availableCategories}`;
          toast.error(errorMessage);
          return;
        }

        if (processedData.length === 0) {
          toast.error("No valid data to import");
          return;
        }

        // Import to database using bulk import endpoint
        try {
          if (!currentUser) {
            toast.error("User not authenticated");
            return;
          }

          const { data: result, error } = await api.bulkImportProducts(
            processedData,
            currentUser.user_id
          );

          if (error) {
            toast.error(`Import failed: ${error}`);
            return;
          }

          if (result) {
            const {
              created,
              updated,
              errors: importErrors,
            } = (result as any).results;

            if (importErrors.length > 0) {
              toast.error(
                `Import completed with ${importErrors.length} errors. Check console for details.`
              );
              console.error("Import errors:", importErrors);
            } else {
              toast.success(
                `Import successful: ${created} created, ${updated} updated`
              );
            }

            // Optimize state update - merge new/updated products without full refetch
            if (created > 0 || updated > 0) {
              // Only refetch if we have changes
              refetchProducts();
            }
          }
        } catch (error) {
          console.error("Import error:", error);
          toast.error("Failed to import data to database");
        }
      } catch (error) {
        const errorMessage = handleError(error, "Import Excel");
        toast.error(errorMessage);
      }
    };
    input.click();
  }, [categories, branchId, currentUser, refetchProducts, handleError]);

  const handleExportExcel = useCallback(() => {
    try {
      if (products.length === 0) {
        toast.error("No products to export");
        return;
      }

      const exportData = products.map((product: Product) => ({
        "Product ID": product.id,
        "Product Name": product.name,
        Category:
          categories.find((cat) => cat.id === product.category)
            ?.category_name || "Unknown",
        Price: parseFloat(product.price.replace("Php ", "").replace(",", "")),
        Quantity: product.stock,
        Status: product.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `products_export_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, filename);
      toast.success("Excel file exported successfully");
    } catch (error) {
      const errorMessage = handleError(error, "Export Excel");
      toast.error(errorMessage);
    }
  }, [products, categories, handleError]);


  // Show loading while user data is being fetched
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading user information...
          </p>
        </div>
      </div>
    );
  }

  // Error handling
  if (productsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
              Access Error
            </h3>
            <p className="text-red-700 dark:text-red-300">{productsError}</p>
          </div>
          {currentUser?.branch_id && (
            <button
              onClick={() => refetchProducts()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Error loading categories: {categoriesError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 dark:bg-gray-900/70 min-h-screen`}
    >
      <div className="bg-white dark:bg-gray-900/70 shadow-mdrounded-lg shadow-md overflow-hidden">
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

        <div className="p-6">
          <div className="flex flex-col gap-4 mb-6">
            {/* Header Row */}
            <div className="flex flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeft size={26} />
                </button>
                <h5 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="h-7 w-7" />
                  Available Stocks
                  {currentUser?.branch_id && (
                    <span className="ml-3 text-base px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                      Branch ID: {currentUser.branch_id}
                    </span>
                  )}
                </h5>
              </div>

              <button
                onClick={refetchProducts}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-base font-bold bg-transparent
                 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.6)]
                 dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(60,60,60,0.4)]
                 hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.1),inset_-6px_-6px_12px_rgba(255,255,255,0.5)]
                 dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.7),inset_-6px_-6px_12px_rgba(40,40,40,0.5)]
                 transition-all duration-300 text-blue-600 dark:text-blue-400"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Subtitle */}
            <p className="text-base text-gray-600 dark:text-gray-400">
              Complete inventory including local and transferred products
            </p>
            {/* Action Buttons */}
            <div className="flex flex-row-reverse gap-3 flex-shrink-0">
              {selectedProducts.length > 0 && (
                <button
                  onClick={confirmBulkDelete}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl text-base text-red-500 outline-1 dark:outline-0 bg-transparent neumorphic-button-transparent 
       "
                >
                  <Trash2 className="w-6 h-6" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
              {[
                {
                  label: "Import",
                  icon: Upload,
                  handler: handleImportExcel,
                  bg: "green",
                },
                {
                  label: "Export",
                  icon: Download,
                  handler: handleExportExcel,
                  bg: "blue",
                },
                // {
                //   label: "Template",
                //   icon: Download,
                //   handler: handleDownloadTemplate,
                //   bg: "gray",
                // },
                {
                  label: "Add",
                  icon: Plus,
                  handler: () => setIsAddModalOpen(true),
                  bg: "blue",
                },
              ].map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.handler}
                  className={`flex items-center gap-2 px-4 py-3 outline-1  dark:outline-0 font-bold rounded-2xl text-base text-white
       shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
       dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]
       hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]
       dark:hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.7),inset_-4px_-4px_8px_rgba(40,40,40,0.5)]
       transition-all`}
                  style={{
                    color:
                      btn.bg === "green"
                        ? "#16a34a"
                        : btn.bg === "blue"
                        ? "#3b82f6"
                        : "#6b7280",
                  }}
                >
                  <btn.icon className="w-6 h-6" />
                  <span className="hidden sm:inline">{btn.label}</span>
                </button>
              ))}
            </div>
            {/* Filter Controls */}
            <div
              className="flex flex-wrap sm:flex-nowrap items-end gap-3 p-3 bg-white dark:bg-gray-900/70 rounded-2xl
             shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.6)]
             dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(60,60,60,0.4)]"
            >
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] sm:w-56">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  className="block w-full pl-10 pr-3 py-2 rounded-2xl text-sm
                 bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white
                 placeholder-gray-400 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600
                 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
                 dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div className="flex-shrink-0 w-full sm:w-auto">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  className="block w-full pl-3 pr-8 py-2 rounded-2xl text-sm bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white
                 border border-gray-300 dark:border-gray-600 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
                 dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(Number(e.target.value))}
                >
                  <option value={0}>All</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex-shrink-0 w-full sm:w-auto">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  className="block w-full pl-3 pr-8 py-2 rounded-2xl text-sm bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white
                 border border-gray-300 dark:border-gray-600 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
                 dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={selectedStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setSelectedStatus(newStatus);
                    // Update URL parameter
                    if (newStatus === "All") {
                      searchParams.delete("status");
                    } else {
                      searchParams.set("status", newStatus);
                    }
                    setSearchParams(searchParams, { replace: true });
                  }}
                >
                  <option value="All">All Status</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Products table */}
          {!isLoading && (
            <div className="w-full overflow-hidden">
              <table className="w-full bg-white dark:bg-gray-900/70 shadow-lg rounded-xl overflow-hidden table-auto break-words">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-900/70 text-lg">
                    <th className="px-4 py-3 text-left font-bold text-gray-900 dark:text-gray-100 w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedProducts.length ===
                            paginatedData.currentItems.length &&
                          paginatedData.currentItems.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="h-5 w-5 text-blue-600 rounded-md border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900 dark:text-gray-100">
                      Product ID
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900 dark:text-gray-100">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900 dark:text-gray-100">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900 dark:text-gray-100">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900 dark:text-gray-100">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900 dark:text-gray-100">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900 dark:text-gray-100">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="text-lg text-gray-800 dark:text-gray-200 divide-y divide-gray-200 dark:divide-neutral-700">
                  {paginatedData.currentItems.length > 0 ? (
                    paginatedData.currentItems.map((product: Product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        categories={categories}
                        selectedProducts={selectedProducts}
                        onToggleSelection={toggleProductSelection}
                        onEdit={setupEditProduct}
                        onDelete={confirmDelete}
                        branchId={branchId}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-xl font-medium text-gray-500 dark:text-gray-400"
                      >
                        No products found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={paginatedData.totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredProducts.length}
            itemsPerPage={itemsPerPage}
            indexOfFirstItem={paginatedData.indexOfFirstItem}
            indexOfLastItem={paginatedData.indexOfLastItem}
          />

          {/* Transferred Items Table */}
          {transferredProducts.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Updated Products From Transfer
              </h3>

              {/* Loading state for transfer table */}
              {isLoading && (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {!isLoading && (
                <>
                  <div className="flex flex-col gap-4 mb-4 sm:flex-row">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Search Products
                      </label>
                      <input
                        type="text"
                        placeholder="Search by name or ID"
                        value={transferSearchTerm}
                        onChange={(e) => setTransferSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 rounded-2xl bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="w-full sm:w-52">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Transfer Type
                      </label>
                      <select
                        value={transferTypeFilter}
                        onChange={(e) =>
                          setTransferTypeFilter(
                            e.target.value as "All" | "New" | "Updated"
                          )
                        }
                        className="block w-full px-3 py-2 rounded-2xl bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="All">All Transfers</option>
                        <option value="New">New Items</option>
                        <option value="Updated">Updated Stock</option>
                      </select>
                    </div>
                    <div className="w-full sm:w-52">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sort Order
                      </label>
                      <select
                        value={transferSortOrder}
                        onChange={(e) =>
                          setTransferSortOrder(
                            e.target.value as "Latest" | "Oldest"
                          )
                        }
                        className="block w-full px-3 py-2 rounded-2xl bg-white dark:bg-gray-900/70 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Latest">Latest First</option>
                        <option value="Oldest">Oldest First</option>
                      </select>
                    </div>
                  </div>
                  <div className="w-full overflow-x-auto">
                    <table className="w-full bg-white dark:bg-gray-900/70 shadow-lg rounded-xl overflow-hidden table-auto min-w-[500px] sm:min-w-[640px]">
                      <thead>
                        <tr className="bg-blue-50 dark:bg-blue-900/20 text-lg">
                          <th className="px-3 py-2 text-left font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            Product ID
                          </th>
                          <th className="px-3 py-2 text-left font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            Product Name
                          </th>
                          <th className="px-3 py-2 text-left font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            Old Quantity
                          </th>
                          <th className="px-3 py-2 text-left font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            Added Quantity
                          </th>
                          <th className="px-3 py-2 text-left font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            New / Updated Quantity
                          </th>
                          <th className="px-3 py-2 text-left font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            Transfer Type
                          </th>
                          <th className="px-3 py-2 text-left font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            Requested From
                          </th>
                          <th className="px-3 py-2 text-left font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            Arrival Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-lg text-gray-800 dark:text-gray-200 divide-y divide-gray-200 dark:divide-neutral-700">
                        {filteredTransferredProducts.length > 0 ? (
                          filteredTransferredProducts.map(
                            (product: Product) => {
                              const categoryName =
                                categories.find(
                                  (cat) => Number(cat.id) === product.category
                                )?.category_name || "Unknown";
                              const changeType =
                                product.transferTag === "New Item from Transfer"
                                  ? "New Product"
                                  : "Stock Update";
                              const changeTypeBadge =
                                product.transferTag === "New Item from Transfer"
                                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200"
                                  : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200";

                              // Get added quantity from audit log metadata
                              // Debug: Log the product to see what we have
                              console.log(`Display - Product ${product.id}:`, {
                                quantityAdded: product.quantityAdded,
                                previousQuantity: product.previousQuantity,
                                transferTag: product.transferTag,
                                stock: product.stock,
                              });

                              const addedQuantity =
                                typeof product.quantityAdded === "number" &&
                                product.quantityAdded > 0
                                  ? product.quantityAdded
                                  : product.transferTag ===
                                    "New Item from Transfer"
                                  ? product.stock
                                  : 0;

                              console.log(
                                `Display - Calculated addedQuantity:`,
                                addedQuantity
                              );

                              // Get old quantity from audit log metadata (more accurate)
                              const oldQuantity =
                                product.transferTag === "New Item from Transfer"
                                  ? 0
                                  : typeof product.previousQuantity ===
                                      "number" && product.previousQuantity >= 0
                                  ? product.previousQuantity
                                  : Math.max(product.stock - addedQuantity, 0);

                              const newQuantity = oldQuantity + addedQuantity;

                              return (
                                <tr
                                  key={product.id}
                                  className="hover:bg-gray-50 dark:hover:bg-neutral-700"
                                >
                                  <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 font-mono">
                                    {`${
                                      product.branch_id || branchId || "N/A"
                                    }-${String(product.id).padStart(4, "0")}`}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="flex flex-col max-w-[120px] sm:max-w-[200px] md:max-w-none">
                                      <span className="font-medium truncate">
                                        {product.name}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {categoryName}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 font-semibold">
                                    {oldQuantity} units
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 font-semibold">
                                    +{addedQuantity} units
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 font-semibold">
                                    {newQuantity} units
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${changeTypeBadge} whitespace-nowrap`}
                                    >
                                      <span className="hidden sm:inline">
                                        {changeType}
                                      </span>
                                      <span className="sm:hidden">
                                        {product.transferTag ===
                                        "New Item from Transfer"
                                          ? "New"
                                          : "Update"}
                                      </span>
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                    {product.transferred_from || "Unknown Branch"}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="hidden sm:block">
                                      {product.transferTagAppliedAt
                                        ? new Date(
                                            product.transferTagAppliedAt
                                          ).toLocaleString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : "N/A"}
                                    </div>
                                    <div className="sm:hidden">
                                      {product.transferTagAppliedAt
                                        ? new Date(
                                            product.transferTagAppliedAt
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : "N/A"}
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                          )
                        ) : (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-6 py-10 text-center text-base text-gray-500 dark:text-gray-400"
                            >
                              No transfers match your filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-900/70">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-sm">
              <small className="text-gray-500 dark:text-gray-400">
                Last updated {new Date().toLocaleTimeString()}
              </small>
              <div className="flex items-center gap-4">
                <span className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{localProducts.length}</span>{" "}
                  Local
                </span>
                {transferredProducts.length > 0 && (
                  <span className="text-gray-600 dark:text-gray-300">
                    <span className="font-medium">
                      {transferredProducts.length}
                    </span>{" "}
                    Updated via Transfer
                  </span>
                )}
                <span className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{products.length}</span> Total
                  Products
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddProduct}
        categories={categories}
        statusOptions={STATUS_OPTIONS}
      />

      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditProduct}
        product={
          editingProduct || {
            id: 0,
            name: "",
            category: 0,
            price: "",
            stock: 0,
            status: "In Stock",
          }
        }
        categories={categories}
        statusOptions={STATUS_OPTIONS}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-gray-900/90 rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Confirm Deletion
              </h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this product? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-md neumorphic-button-transparent hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 outline-1 dark:outline-0"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 neumorphic-button-transparent  text-red-600 dark:text-red-500 outline-1 dark:outline-0 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Confirm Deletion
              </h3>
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete {selectedProducts.length} selected
              product(s)? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-md neumorphic-button-transparent hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 outline-1 dark:outline-0"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 neumorphic-button-transparent  text-red-600 dark:text-red-500 outline-1 dark:outline-0 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OptimizedAllStock;
