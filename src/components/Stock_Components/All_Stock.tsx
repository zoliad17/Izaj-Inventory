import { useState, useEffect } from "react";
import light1 from "/src/assets/image/light1.jpg";
import { useSidebar } from "../Sidebar/SidebarContext";
import { Upload, Plus, Edit, Trash2, X, Search } from "lucide-react";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";
import { supabase } from "../../../backend/Server/Supabase/supabase";

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: "In Stock" | "Out of Stock" | "Low Stock";
  detailsPage?: string;
}

const STATUS_OPTIONS: ("In Stock" | "Out of Stock" | "Low Stock")[] = [
  "In Stock",
  "Low Stock",
  "Out of Stock",
];

function AllStock() {
  const { isCollapsed } = useSidebar();

  const [products, setProducts] = useState<Product[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] =
    useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Add missing state for filters, pagination, and handlers
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const storedBranchId = localStorage.getItem("branchId");
    if (storedBranchId) {
      setBranchId(storedBranchId);
    }
  }, []);

  // Move fetchProducts to top-level so it can be reused
  const fetchProducts = async () => {
    if (!branchId) return;
    try {
      const response = await fetch(`http://localhost:5000/api/products?branch_id=${branchId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }
      const data = await response.json();
      const mapped = data.map((product: any) => ({
        id: product.id,
        name: product.product_name,
        category: product.category_name || "Unknown",
        price: Number(product.price).toFixed(2),
        stock: product.quantity,
        status: getStatus(product.quantity) as
          | "In Stock"
          | "Low Stock"
          | "Out of Stock",
        imageUrl: light1,
        detailsPage: `/product/${product.id}`,
      }));
      setProducts(mapped);
    } catch (error) {
      console.error("Error fetching products:", error);
      // You might want to show an error message to the user here
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  // Accept branchId as an optional second argument
  const handleAddProduct = async (
    productData: {
      name: string;
      category: string;
      price: string;
      stock: string;
      status: "In Stock" | "Out of Stock" | "Low Stock";
    },
    branchIdOverride?: string
  ) => {
    const branchToUse = branchIdOverride || branchId;
    if (!branchToUse) return;
    try {
      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productData,
          category: productData.category,
          branch_id: branchToUse,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product');
      }
      await fetchProducts();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Error adding product:", err);
      // You might want to show an error message to the user here
    }
  };

  const handleEditProduct = async (productData: {
    id: string;
    name: string;
    category: string;
    price: string;
    stock: string;
    status: "In Stock" | "Out of Stock" | "Low Stock";
  }) => {
    const { error } = await supabase
      .from("centralized_product")
      .update({
        product_name: productData.name,
        quantity: Number(productData.stock),
        price: Number(productData.price),
      })
      .eq("id", productData.id);

    if (error) {
      console.error("Error updating product:", error.message);
    } else {
      await fetchProducts();
      setIsEditModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (productToDelete) {
      await supabase.from("centralized_product").delete().eq("id", productToDelete);
      await fetchProducts();
      setIsDeleteModalOpen(false);
    }
  };

  const handleBulkDelete = async () => {
    await supabase.from("centralized_product").delete().in("id", selectedProducts);
    await fetchProducts();
    setIsBulkDeleteModalOpen(false);
  };

  // Filtered products based on search, category, and status
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "All" || product.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Selection logic
  const toggleSelectAll = () => {
    if (selectedProducts.length === currentItems.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentItems.map((product) => product.id));
    }
  };
  const toggleProductSelection = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  // Edit product setup
  const setupEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  // Delete confirmation
  const confirmDelete = (id: string) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };
  const confirmBulkDelete = () => {
    setIsBulkDeleteModalOpen(true);
  };

  // Import Excel stub
  const handleImportExcel = () => {
    alert("Import Excel functionality not implemented yet.");
  };

  // Fix status type in all product mapping
  function getStatus(
    quantity: number
  ): "In Stock" | "Low Stock" | "Out of Stock" {
    if (quantity === 0) return "Out of Stock";
    if (quantity < 20) return "Low Stock";
    return "In Stock";
  }

  const [categories, setCategories] = useState<
    { id: string; category_name: string }[]
  >([]);

  // Fetch categories from backend on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(
        data.map((cat: any) => ({
          id: cat.id,
          category_name: cat.category_name,
        }))
      );
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  return (
    <div
      className={`transition-all duration-300 ${isCollapsed ? "ml-5" : "ml-1"
        } p-2 sm:p-4`}
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden ">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h5 className="text-xl font-bold">All Stock</h5>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap sm:flex-nowrap items-end gap-4 mb-6 overflow-x-auto">
            {/* Search Input */}
            <div className="relative flex-shrink-0 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="flex-shrink-0">
              <label
                htmlFor="category-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category-filter"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.category_name}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex-shrink-0">
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status-filter"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {selectedProducts.length > 0 && (
                <button
                  onClick={confirmBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Delete Selected</span>
                </button>
              )}
              <button
                onClick={handleImportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Upload className="w-5 h-5" />
                <span className="hidden sm:inline">Import</span>
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

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedProducts.length === currentItems.length &&
                        currentItems.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Product ID
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Product Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Category
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Price
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Quantity
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 font-mono">
                        {product.id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 relative cursor-pointer">
                        {product.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {product.category}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        Php {product.price}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {product.stock}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${product.status === "In Stock"
                            ? "bg-green-100 text-green-800"
                            : product.status === "Low Stock"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setupEditProduct(product);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(product.id);
                            }}
                            className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No products found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredProducts.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredProducts.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredProducts.length}
                    </span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <div
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                      <span className="sr-only"></span>
                      &larr;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                      <span className="sr-only"></span>
                      &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-100">
          <small className="text-gray-500">Last updated 3 mins ago</small>
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
            id: "",
            name: "",
            category: "",
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
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-6">
              Are you sure you want to delete this product? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-6">
              Are you sure you want to delete {selectedProducts.length} selected
              product(s)? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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

export default AllStock;
