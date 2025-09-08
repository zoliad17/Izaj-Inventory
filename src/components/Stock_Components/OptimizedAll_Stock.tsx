import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useSidebar } from "../Sidebar/SidebarContext";
import { Upload, Plus, Edit, Trash2, X, Search, ArrowLeft, Download, Package, ArrowRight } from "lucide-react";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";
import { useCategories } from "../../hooks/useOptimizedFetch";
import { api } from "../../utils/apiClient";
import { useErrorHandler } from "../../utils/errorHandler";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import { useAuth } from "../../contexts/AuthContext";

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
}

const STATUS_OPTIONS: ("In Stock" | "Out of Stock" | "Low Stock")[] = [
    "In Stock",
    "Low Stock",
    "Out of Stock",
];

// Memoized status component
const ProductStatus = memo(({ status }: { status: string }) => (
    <span
        className={`px-2 py-1 rounded-full text-xs ${status === "In Stock"
            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
            : status === "Low Stock"
                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
            }`}
    >
        {status}
    </span>
));

ProductStatus.displayName = 'ProductStatus';

// Memoized product row component
const ProductRow = memo(({
    product,
    categories,
    selectedProducts,
    onToggleSelection,
    onEdit,
    onDelete,
    branchId
}: {
    product: Product;
    categories: Array<{ id: number; category_name: string }>;
    selectedProducts: number[];
    onToggleSelection: (id: number) => void;
    onEdit: (product: Product) => void;
    onDelete: (id: number) => void;
    branchId: number | null;
}) => {
    const categoryName = useMemo(() =>
        categories.find(cat => Number(cat.id) === product.category)?.category_name || "Unknown",
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
                {`${product.branch_id || branchId || 'N/A'}-${String(product.id).padStart(4, "0")}`}
            </td>
            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 relative cursor-pointer">
                <div className="flex items-center gap-2">
                    <span>{product.name}</span>
                    {product.source === "Transferred" && (
                        <div className="flex items-center gap-1">
                            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                Transferred
                            </span>
                            {product.transferred_from && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    from {product.transferred_from}
                                </span>
                            )}
                        </div>
                    )}
                </div>
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
});

ProductRow.displayName = 'ProductRow';

// Memoized pagination component
const Pagination = memo(({
    currentPage,
    totalPages,
    onPageChange
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 dark:bg-neutral-700 border-t border-gray-200 dark:border-neutral-600 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                    </p>
                </div>
                {totalPages > 1 && (
                    <div>
                        <div className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm font-medium ${currentPage === 1
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
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                                        ? "z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-300"
                                        : "bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-600"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-sm font-medium ${currentPage === totalPages
                                    ? "text-gray-300 dark:text-neutral-500 cursor-not-allowed"
                                    : "text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-600"
                                    }`}
                            >
                                <span className="sr-only">Next</span>
                                &rarr;
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

Pagination.displayName = 'Pagination';

function OptimizedAllStock() {
    const { isCollapsed } = useSidebar();
    const navigate = useNavigate();
    const { handleError } = useErrorHandler();
    const { user: currentUser } = useAuth();

    const [branchId, setBranchId] = useState<number | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Filters and pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(0);
    const [selectedStatus, setSelectedStatus] = useState<string>("All");
    const [selectedSource, setSelectedSource] = useState<string>("All");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Get branch ID from current user's profile
    useEffect(() => {
        if (currentUser?.branch_id) {
            setBranchId(currentUser.branch_id);
        } else {
            // If user doesn't have a branch_id, show error
            setProductsError("User is not assigned to any branch. Please contact administrator.");
            setIsLoading(false);
        }
    }, [currentUser]);

    // State for products and loading
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [productsError, setProductsError] = useState<string | null>(null);

    // Use optimized hook for categories
    const {
        data: categoriesData,
        error: categoriesError
    } = useCategories() as {
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
            const { data: branchProducts, error: branchError } = await api.getBranchProducts(branchId);

            if (branchError) {
                throw new Error(branchError);
            }


            // Map branch products (these are all products currently in the user's branch)
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
                source: "Local" as const,
                transferred_from: undefined,
                transferred_at: undefined,
                request_id: undefined,
            }));



            // Fetch audit logs to identify transferred products
            if (currentUser) {
                try {
                    const { data: auditLogs, error: auditError } = await api.getUserAuditLogs(currentUser.user_id);

                    if (!auditError && auditLogs && Array.isArray(auditLogs)) {
                        // Find inventory transfer logs for this user
                        const transferLogs = auditLogs.filter((log: any) =>
                            log.action === 'INVENTORY_TRANSFER' &&
                            log.entity_type === 'centralized_product' &&
                            log.metadata?.requester_branch_id === branchId
                        );

                        // Update products that were transferred
                        const updatedProducts = mappedProducts.map((product: Product) => {
                            const transferLog = transferLogs.find((log: any) =>
                                log.metadata?.product_id === product.id
                            );

                            if (transferLog) {
                                return {
                                    ...product,
                                    source: "Transferred" as const,
                                    transferred_from: transferLog.metadata?.source_branch_name || "Unknown Branch",
                                    transferred_at: transferLog.timestamp,
                                    request_id: transferLog.metadata?.request_id,
                                };
                            }

                            return product;
                        });

                        setProducts(updatedProducts);
                    } else {
                        setProducts(mappedProducts);
                    }
                } catch (auditError) {
                    console.warn("Could not fetch transfer history, showing local products only:", auditError);
                    setProducts(mappedProducts);
                }
            } else {
                setProducts(mappedProducts);
            }

        } catch (error) {
            console.error("Error fetching products:", error);
            const errorMessage = error instanceof Error ? error.message : "Error fetching products";
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

    // Refetch function for external use
    const refetchProducts = useCallback(() => {
        fetchProducts();
    }, [fetchProducts]);


    // Memoized filtered products
    const filteredProducts = useMemo(() => {
        return products.filter((product: Product) => {
            // First filter: Only show products from the current user's branch
            const matchesBranch = branchId ? product.branch_id === branchId : true;

            const matchesSearch =
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(product.id).toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory =
                selectedCategory === 0 || product.category === selectedCategory;
            const matchesStatus =
                selectedStatus === "All" || product.status === selectedStatus;
            const matchesSource =
                selectedSource === "All" || product.source === selectedSource;

            return matchesBranch && matchesSearch && matchesCategory && matchesStatus && matchesSource;
        });
    }, [products, branchId, searchTerm, selectedCategory, selectedStatus, selectedSource]);

    // Memoized pagination data
    const paginatedData = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

        return {
            currentItems,
            totalPages,
            indexOfFirstItem,
            indexOfLastItem
        };
    }, [filteredProducts, currentPage, itemsPerPage]);


    // Memoized handlers
    const handleAddProduct = useCallback(async (productData: {
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
            branch_id: branchId
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
            const errorMessage = handleError(err, 'Add product');
            toast.error(errorMessage);
        }
    }, [branchId, refetchProducts, handleError]);

    const handleEditProduct = useCallback(async (productData: {
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

            const { error } = await api.updateProduct(productData.id, productData, currentUser.user_id);

            if (error) {
                toast.error(error);
                return;
            }

            toast.success("Product updated successfully!");
            refetchProducts();
            setIsEditModalOpen(false);
        } catch (err) {
            const errorMessage = handleError(err, 'Update product');
            toast.error(errorMessage);
        }
    }, [refetchProducts, handleError]);

    const handleDelete = useCallback(async () => {
        if (!productToDelete) return;

        try {
            if (!currentUser) {
                toast.error("User not authenticated");
                return;
            }

            const { error } = await api.deleteProduct(productToDelete, currentUser.user_id);

            if (error) {
                // Check if it's a 409 conflict (active requests)
                if (error.includes("active request") || error.includes("Cannot delete product")) {
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
            const errorMessage = handleError(err, 'Delete product');
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
                .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
                .map(result => result.reason);

            const failedDeletes = results
                .filter((result): result is PromiseFulfilledResult<{ id: number; result: any }> =>
                    result.status === 'fulfilled' && !!result.value.result.error
                )
                .map(result => ({ id: result.value.id, error: result.value.result.error }));

            if (errors.length > 0 || failedDeletes.length > 0) {
                const totalFailed = errors.length + failedDeletes.length;
                const activeRequestErrors = failedDeletes.filter(f =>
                    f.error.includes("active request") || f.error.includes("Cannot delete product")
                );

                if (activeRequestErrors.length > 0) {
                    toast.error(`${activeRequestErrors.length} products cannot be deleted due to active requests. Please complete or cancel the requests first.`, { duration: 8000 });
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
            const errorMessage = handleError(err, 'Bulk delete products');
            toast.error(errorMessage);
        }
    }, [selectedProducts, refetchProducts, handleError]);

    // Selection handlers
    const toggleSelectAll = useCallback(() => {
        if (selectedProducts.length === paginatedData.currentItems.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(paginatedData.currentItems.map((product: Product) => product.id));
        }
    }, [selectedProducts.length, paginatedData.currentItems]);

    const toggleProductSelection = useCallback((id: number) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
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
            toast.error('Categories not loaded yet. Please try again in a moment.');
            return;
        }

        if (!branchId) {
            toast.error('Branch ID not available. Please try again.');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
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
                    toast.error('Excel file is empty');
                    return;
                }

                const requiredColumns = ['Product Name', 'Category', 'Price', 'Quantity', 'Status'];
                const firstRow = jsonData[0] as any;
                const hasRequiredColumns = requiredColumns.every(col =>
                    Object.keys(firstRow).includes(col)
                );

                if (!hasRequiredColumns) {
                    toast.error(`Excel template must contain columns: ${requiredColumns.join(', ')}`);
                    return;
                }

                // Process and validate data
                const processedData = [];
                const errors = [];

                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i] as any;
                    const rowNum = i + 2; // Excel row number (accounting for header)

                    // Validate required fields
                    if (!row['Product Name'] || !row['Category'] || !row['Price'] || row['Quantity'] === undefined) {
                        errors.push(`Row ${rowNum}: Missing required fields`);
                        continue;
                    }

                    // Validate data types
                    const price = parseFloat(row['Price']);
                    const quantity = parseInt(row['Quantity']);

                    if (isNaN(price) || price < 0) {
                        errors.push(`Row ${rowNum}: Invalid price value`);
                        continue;
                    }

                    if (isNaN(quantity) || quantity < 0) {
                        errors.push(`Row ${rowNum}: Invalid quantity value`);
                        continue;
                    }

                    // Validate status
                    const validStatuses = ['In Stock', 'Out of Stock', 'Low Stock'];
                    if (!validStatuses.includes(row['Status'])) {
                        errors.push(`Row ${rowNum}: Invalid status. Must be one of: ${validStatuses.join(', ')}`);
                        continue;
                    }

                    // Find category ID (case-insensitive, trim whitespace, and handle singular/plural)
                    const categoryName = row['Category'].toString().trim();

                    // Try exact match first
                    let category = categories.find(cat =>
                        cat.category_name.toLowerCase() === categoryName.toLowerCase()
                    );

                    // If no exact match, try singular/plural variations
                    if (!category) {
                        category = categories.find(cat => {
                            const dbCategory = cat.category_name.toLowerCase();
                            const inputCategory = categoryName.toLowerCase();

                            // Check if one is singular and other is plural
                            return (
                                dbCategory === inputCategory + 's' || // DB has plural, input has singular
                                inputCategory === dbCategory + 's' || // Input has plural, DB has singular
                                dbCategory === inputCategory.slice(0, -1) || // DB has singular, input has plural
                                inputCategory === dbCategory.slice(0, -1)    // Input has singular, DB has plural
                            );
                        });
                    }

                    if (!category) {
                        const availableCategories = categories.map(cat => cat.category_name).join(', ');
                        errors.push(`Row ${rowNum}: Category "${categoryName}" not found. Available categories: ${availableCategories}`);
                        continue;
                    }

                    processedData.push({
                        name: row['Product Name'],
                        category: category.id,
                        price: price,
                        stock: quantity, // This will be added to existing quantity for updates
                        status: row['Status'],
                        branch_id: branchId
                    });

                    // Log zero quantity products for debugging
                    if (quantity === 0) {
                        console.log(`Processing zero quantity product: ${row['Product Name']} - will be marked as "Out of Stock"`);
                    }
                }

                if (errors.length > 0) {
                    const availableCategories = categories.map(cat => cat.category_name).join(', ');
                    const errorMessage = `Validation errors found:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}\n\nAvailable categories: ${availableCategories}`;
                    toast.error(errorMessage);
                    return;
                }

                if (processedData.length === 0) {
                    toast.error('No valid data to import');
                    return;
                }

                // Import to database using bulk import endpoint
                try {
                    if (!currentUser) {
                        toast.error('User not authenticated');
                        return;
                    }

                    const { data: result, error } = await api.bulkImportProducts(processedData, currentUser.user_id);

                    if (error) {
                        toast.error(`Import failed: ${error}`);
                        return;
                    }

                    if (result) {
                        const { created, updated, errors: importErrors } = (result as any).results;

                        if (importErrors.length > 0) {
                            toast.error(`Import completed with ${importErrors.length} errors. Check console for details.`);
                            console.error('Import errors:', importErrors);
                        } else {
                            toast.success(`Import successful: ${created} created, ${updated} updated`);
                        }

                        // Optimize state update - merge new/updated products without full refetch
                        if (created > 0 || updated > 0) {
                            // Only refetch if we have changes
                            refetchProducts();
                        }
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    toast.error('Failed to import data to database');
                }

            } catch (error) {
                const errorMessage = handleError(error, 'Import Excel');
                toast.error(errorMessage);
            }
        };
        input.click();
    }, [categories, branchId, currentUser, refetchProducts, handleError]);

    const handleExportExcel = useCallback(() => {
        try {
            const exportData = products.map((product: Product) => ({
                'Product ID': product.id,
                'Product Name': product.name,
                'Category': categories.find(cat => cat.id === product.category)?.category_name || 'Unknown',
                'Price': parseFloat(product.price.replace('Php ', '').replace(',', '')),
                'Quantity': product.stock,
                'Status': product.status
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `products_export_${timestamp}.xlsx`;

            XLSX.writeFile(workbook, filename);
            toast.success('Excel file exported successfully');
        } catch (error) {
            const errorMessage = handleError(error, 'Export Excel');
            toast.error(errorMessage);
        }
    }, [products, categories, handleError]);

    // Download Excel Template
    const handleDownloadTemplate = useCallback(() => {
        try {
            if (categories.length === 0) {
                toast.error('Categories not loaded yet. Please try again in a moment.');
                return;
            }

            // Create template with sample data using actual categories
            const templateData = [
                {
                    'Product Name': 'LED Bulb 10W',
                    'Category': categories[0]?.category_name || 'Sample Category',
                    'Price': 299.99,
                    'Quantity': 100,
                    'Status': 'In Stock'
                },
                {
                    'Product Name': 'Smart Light Strip',
                    'Category': categories[1]?.category_name || categories[0]?.category_name || 'Sample Category',
                    'Price': 1299.99,
                    'Quantity': 50,
                    'Status': 'In Stock'
                },
                {
                    'Product Name': 'Chandelier',
                    'Category': categories[2]?.category_name || categories[0]?.category_name || 'Sample Category',
                    'Price': 4999.99,
                    'Quantity': 5,
                    'Status': 'Low Stock'
                },
                {
                    'Product Name': 'Discontinued Lamp',
                    'Category': categories[0]?.category_name || 'Sample Category',
                    'Price': 199.99,
                    'Quantity': 0,
                    'Status': 'Out of Stock'
                }
            ];

            // Create workbook and worksheet
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

            // Download template file
            XLSX.writeFile(workbook, 'product_import_template.xlsx');
            toast.success('Template downloaded successfully');

        } catch (error) {
            const errorMessage = handleError(error, 'Download Template');
            toast.error(errorMessage);
        }
    }, [categories, handleError]);

    // Show loading while user data is being fetched
    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading user information...</p>
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
                    <p className="text-red-600 mb-4">Error loading categories: {categoriesError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? "ml-5" : "ml-1"} p-2 sm:p-4 bg-white dark:bg-neutral-900`}>
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h5 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Available Stocks
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Complete inventory including local and transferred products
                                    {currentUser?.branch_id && (
                                        <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                                            Branch ID: {currentUser.branch_id}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex flex-wrap sm:flex-nowrap items-end gap-4 mb-6 overflow-x-auto">
                        <div className="relative flex-shrink-0 sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-neutral-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex-shrink-0">
                            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category
                            </label>
                            <select
                                id="category-filter"
                                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
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

                        <div className="flex-shrink-0">
                            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                id="status-filter"
                                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-shrink-0">
                            <label htmlFor="source-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Source
                            </label>
                            <select
                                id="source-filter"
                                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                                value={selectedSource}
                                onChange={(e) => setSelectedSource(e.target.value)}
                            >
                                <option value="All">All Sources</option>
                                <option value="Local">Local Inventory</option>
                                <option value="Transferred">Transferred Products</option>
                            </select>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                            {selectedProducts.length > 0 && (
                                <button
                                    onClick={confirmBulkDelete}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    <span className="hidden sm:inline">Delete</span>
                                </button>
                            )}
                            <button
                                onClick={handleImportExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <Upload className="w-5 h-5" />
                                <span className="hidden sm:inline">Import Excel</span>
                            </button>
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <Download className="w-5 h-5" />
                                <span className="hidden sm:inline">Export Excel</span>
                            </button>
                            <button
                                onClick={handleDownloadTemplate}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                <Download className="w-5 h-5" />
                                <span className="hidden sm:inline">Download Template</span>
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">Add Product</span>
                            </button>
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
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white dark:bg-neutral-800">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-neutral-700">
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.length === paginatedData.currentItems.length && paginatedData.currentItems.length > 0}
                                                onChange={toggleSelectAll}
                                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Product ID</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Category</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Price</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
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
                                            <td colSpan={8} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
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
                    />
                </div>

                <div className="p-4 bg-gray-100 dark:bg-neutral-700">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 text-sm">
                            <small className="text-gray-500 dark:text-gray-400">
                                Last updated {new Date().toLocaleTimeString()}
                            </small>
                            <div className="flex items-center gap-4">
                                <span className="text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">{products.filter(p => p.source === "Local").length}</span> Local
                                </span>
                                <span className="text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">{products.filter(p => p.source === "Transferred").length}</span> Transferred
                                </span>
                                <span className="text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">{products.length}</span> Total
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
                product={editingProduct || {
                    id: 0,
                    name: "",
                    category: 0,
                    price: "",
                    stock: 0,
                    status: "In Stock",
                }}
                categories={categories}
                statusOptions={STATUS_OPTIONS}
            />

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Deletion</h3>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="mb-6 text-gray-700 dark:text-gray-300">
                            Are you sure you want to delete this product? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Deletion</h3>
                            <button
                                onClick={() => setIsBulkDeleteModalOpen(false)}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="mb-6 text-gray-700 dark:text-gray-300">
                            Are you sure you want to delete {selectedProducts.length} selected product(s)? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsBulkDeleteModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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
