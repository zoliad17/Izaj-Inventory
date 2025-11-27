import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../../config/config";
import { useSidebar } from "../Sidebar/SidebarContext";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../utils/apiClient";
import {
  ArrowLeft,
  Search,
  Download,
  Plus,
  Edit,
  Trash2,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";

// Define interface for Product data
interface Product {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  status: string;
  branch_id: number;
  category_id: number;
  category_name?: string;
  branch_name?: string;
  updated_at?: string;
  created_at?: string;
}

interface Category {
  id: number;
  category_name: string;
}

function CentralizedProducts() {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [branchFilter, setBranchFilter] = useState<string>("All");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const itemsPerPage = 10;

  // Fetch branches from supabase
  const [branches, setBranches] = useState<{ id: string; location: string }[]>(
    []
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    branch_id: "",
    status: "In Stock",
  });

  // Fetch branches
  useEffect(() => {
    async function fetchBranches() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/branches`);
        if (response.ok) {
          const data = await response.json();
          setBranches(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch branches:", error);
      }
    }
    fetchBranches();
  }, []);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await api.getCategories();
        if (!error && data) {
          setCategories(data as Category[]);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    }
    fetchCategories();
  }, []);

  // Fetch all products from API
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (branchFilter !== "All") {
        params.append("branch_id", branchFilter);
      }

      const url = `${API_BASE_URL}/api/products/all${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [branchFilter]);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        product.branch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toString().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [products, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle add product
  const handleAddProduct = async () => {
    if (!user?.user_id) {
      toast.error("User authentication required");
      return;
    }

    if (
      !formData.name ||
      !formData.category ||
      !formData.price ||
      !formData.stock ||
      !formData.branch_id
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        name: formData.name,
        category: Number(formData.category),
        price: Number(formData.price),
        stock: Number(formData.stock),
        branch_id: Number(formData.branch_id),
        status: formData.status,
      };

      const { error } = await api.createProduct(productData, user.user_id);

      if (error) {
        throw new Error(error);
      }

      toast.success("Product created successfully!");
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        category: "",
        price: "",
        stock: "",
        branch_id: "",
        status: "In Stock",
      });
      await fetchProducts();
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create product"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle edit product
  const handleEditProduct = async () => {
    if (!user?.user_id || !selectedProduct) {
      toast.error("User authentication required");
      return;
    }

    if (
      !formData.name ||
      !formData.category ||
      !formData.price ||
      !formData.stock ||
      !formData.branch_id
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        name: formData.name,
        category: Number(formData.category),
        price: Number(formData.price),
        stock: Number(formData.stock),
        branch_id: Number(formData.branch_id),
        status: formData.status,
      };

      const { error } = await api.updateProduct(
        selectedProduct.id,
        productData,
        user.user_id
      );

      if (error) {
        throw new Error(error);
      }

      toast.success("Product updated successfully!");
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      setFormData({
        name: "",
        category: "",
        price: "",
        stock: "",
        branch_id: "",
        status: "In Stock",
      });
      await fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update product"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!user?.user_id || !productToDelete) {
      toast.error("User authentication required");
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await api.deleteProduct(productToDelete, user.user_id);

      if (error) {
        throw new Error(error);
      }

      toast.success("Product deleted successfully!");
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      await fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete product"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Open edit modal
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.product_name,
      category: product.category_id.toString(),
      price: product.price.toString(),
      stock: product.quantity.toString(),
      branch_id: product.branch_id.toString(),
      status: product.status,
    });
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (productId: number) => {
    setProductToDelete(productId);
    setIsDeleteModalOpen(true);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  // Export products to Excel
  const exportToExcel = () => {
    try {
      if (filteredProducts.length === 0) {
        toast.error("No products to export");
        return;
      }

      // Prepare data for export
      const exportData = filteredProducts.map((product) => ({
        "Product ID": product.id,
        "Product Name": product.product_name,
        Category: product.category_name || "N/A",
        Branch: product.branch_name || "N/A",
        Quantity: product.quantity,
        Price: product.price,
        Status: product.status || "N/A",
        "Updated At": product.updated_at
          ? formatDate(product.updated_at)
          : "N/A",
      }));

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Create a worksheet from the data
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Product ID
        { wch: 30 }, // Product Name
        { wch: 20 }, // Category
        { wch: 20 }, // Branch
        { wch: 12 }, // Quantity
        { wch: 15 }, // Price
        { wch: 15 }, // Status
        { wch: 20 }, // Updated At
      ];
      ws["!cols"] = colWidths;

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Centralized Products");

      // Generate filename with current date
      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `centralized_products_export_${currentDate}.xlsx`;

      // Save the file
      XLSX.writeFile(wb, filename);

      toast.success(`Products exported successfully as ${filename}`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export products to Excel");
    }
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-0.5"
      } p-1 sm:p-4 dark:bg-gray-900/70 min-h-screen w-full overflow-x-hidden`}
    >
      <div className="p-1">
        {/* Toaster for success and error */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h5 className="text-2xl font-bold text-gray-900 dark:text-white">
            Centralized Products
          </h5>
        </div>

        {/* Search, Branch Filter and Export Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="block w-full pl-10 pr-3 py-2 rounded-xl 
                  bg-white dark:bg-gray-900 border border-transparent
                  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300
                  shadow-[inset_4px_4px_8px_rgba(0,0,0,0.08),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] 
                  dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]
                  focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm
                  transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Branch Filter */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={branchFilter}
                onChange={(e) => {
                  setBranchFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
                className="block w-full pl-10 pr-3 py-2 rounded-xl 
                  bg-white dark:bg-gray-900 border border-transparent
                  text-gray-900 dark:text-white
                  shadow-[inset_4px_4px_8px_rgba(0,0,0,0.08),inset_-4px_-4px_8px_rgba(255,255,255,0.6)] 
                  dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]
                  focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm
                  transition-all"
              >
                <option value="All">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-2 text-blue-700 px-4 py-2 rounded-xl font-semibold shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] hover:scale-[1.05] active:scale-[0.97] transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Product</span>
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold text-green-600 shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] hover:scale-[1.05] active:scale-[0.97] transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export to Excel</span>
            </button>
          </div>
        </div>

        {/* Products Table */}
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 shadow sm:rounded-lg mt-3.5 w-full">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="w-32 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product ID
                    </th>
                    <th className="w-40 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="w-32 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="w-32 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="w-24 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="w-24 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="w-24 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-32 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Updated At
                    </th>
                    <th className="w-32 px-2 sm:px-4 lg:px-6 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentProducts.length > 0 ? (
                    currentProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="text-base font-medium text-gray-900 dark:text-white">
                            {product.id}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div
                            className="text-base font-small text-gray-900 dark:text-white clamp-1"
                            title={product.product_name}
                          >
                            {product.product_name}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="font-small text-gray-900 dark:text-white">
                            {product.category_name || "N/A"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="font-small text-gray-900 dark:text-white">
                            {product.branch_name || "N/A"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="text-base text-gray-900 dark:text-white">
                            {product.quantity}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="text-base text-gray-900 dark:text-white">
                            Php {Number(product.price).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <span
                            className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-lg shadow-sm border-2 backdrop-blur-sm ${
                              product.status === "In Stock"
                                ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700"
                                : product.status === "Low Stock"
                                ? "bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-800/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700"
                                : "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700"
                            }`}
                          >
                            {product.status || "N/A"}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="text-base font-small text-gray-900 dark:text-white">
                            {formatDate(product.updated_at)}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => openEditModal(product)}
                              className="inline-flex items-center px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-xl text-blue-700 dark:text-blue-500 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(product.id)}
                              className="inline-flex items-center px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-xl text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-6 text-center text-base text-gray-500 dark:text-gray-400"
                      >
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredProducts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 px-2 sm:px-4 lg:px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          currentPage * itemsPerPage,
                          filteredProducts.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {filteredProducts.length}
                      </span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">First</span>
                        <ChevronsLeft size={20} />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft size={20} />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? "z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-300"
                                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      )}

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight size={20} />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Last</span>
                        <ChevronsRight size={20} />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Add New Product
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Column 1 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Product Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    placeholder="0"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  if (!isSaving) {
                    setIsAddModalOpen(false);
                    setFormData({
                      name: "",
                      category: "",
                      price: "",
                      stock: "",
                      branch_id: "",
                      status: "In Stock",
                    });
                  }
                }}
                disabled={isSaving}
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isSaving
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={isSaving}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium shadow-md transition-all duration-300 ${
                  isSaving
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Adding...
                  </>
                ) : (
                  "Add Product"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Edit Product
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Column 1 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Product Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    placeholder="0"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  if (!isSaving) {
                    setIsEditModalOpen(false);
                    setSelectedProduct(null);
                    setFormData({
                      name: "",
                      category: "",
                      price: "",
                      stock: "",
                      branch_id: "",
                      status: "In Stock",
                    });
                  }
                }}
                disabled={isSaving}
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isSaving
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleEditProduct}
                disabled={isSaving}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium shadow-md transition-all duration-300 ${
                  isSaving
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Updating...
                  </>
                ) : (
                  "Update Product"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!isDeleting) setIsDeleteModalOpen(false);
            }}
          ></div>
          <div className="relative bg-gray-100 dark:bg-gray-900 rounded-2xl p-6 w-96 transition-all duration-300">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Confirm Delete
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this product? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  if (!isDeleting) {
                    setIsDeleteModalOpen(false);
                    setProductToDelete(null);
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300
          shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.8)]
          dark:shadow-[4px_4px_8px_rgba(0,0,0,0.7),-4px_-4px_8px_rgba(50,50,50,0.5)]
          hover:scale-[1.05] hover:text-gray-800 dark:hover:text-gray-100
          hover:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.6)]
          dark:hover:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.9),inset_-3px_-3px_6px_rgba(50,50,50,0.4)]
          transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold
          shadow-[4px_4px_8px_rgba(0,0,0,0.2),-4px_-4px_8px_rgba(255,255,255,0.7)]
          dark:shadow-[4px_4px_8px_rgba(0,0,0,0.9),-4px_-4px_8px_rgba(50,50,50,0.4)]
          hover:scale-[1.05] hover:bg-red-600
          hover:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]
          dark:hover:bg-red-600
          transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CentralizedProducts;
