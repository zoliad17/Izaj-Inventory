import { useState } from "react";
import { useNavigate } from "react-router-dom";
import light1 from "/src/assets/image/light1.jpg";
import { useSidebar } from "../Sidebar/SidebarContext";
import { Upload, Plus, Edit, Trash2, X } from "lucide-react";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: "In Stock" | "Out of Stock" | "Low Stock";
  imageUrl: string;
  description?: string;
  detailsPage?: string;
}

const CATEGORIES = ["Bulbs", "Lights", "Fixtures", "Accessories"] as const;
const STATUS_OPTIONS: ("In Stock" | "Out of Stock" | "Low Stock")[] = [
  "In Stock",
  "Low Stock",
  "Out of Stock",
];

function AllStock() {
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([
    {
      id: "001",
      name: "LED Bulb",
      category: "Bulbs",
      price: "345.99",
      stock: 100,
      status: "In Stock",
      imageUrl: light1,
      description: "High-efficiency LED bulb with a long lifespan.",
      detailsPage: "/product/001",
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] =
    useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product selection handlers
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product.id));
    }
  };

  // Product CRUD operations
  const handleAddProduct = (productData: {
    name: string;
    category: string;
    price: string;
    stock: string;
    status: "In Stock" | "Out of Stock" | "Low Stock";
    description: string;
  }) => {
    const newId = String(products.length + 1).padStart(3, "0");
    const productToAdd: Product = {
      ...productData,
      id: newId,
      stock: Number(productData.stock),
      imageUrl: light1,
      detailsPage: `/product/${newId}`,
    };
    setProducts((prev) => [...prev, productToAdd]);
  };

  const handleEditProduct = (productData: {
    id: string;
    name: string;
    category: string;
    price: string;
    stock: string;
    status: "In Stock" | "Out of Stock" | "Low Stock";
    description: string;
  }) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productData.id
          ? {
              ...product,
              name: productData.name,
              category: productData.category,
              price: productData.price,
              stock: Number(productData.stock),
              status: productData.status,
              description: productData.description,
            }
          : product
      )
    );
  };

  // Delete handlers
  const confirmDelete = (productId: string) => {
    setProductToDelete(productId);
    setIsDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    if (selectedProducts.length > 0) {
      setIsBulkDeleteModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (productToDelete) {
      setProducts(products.filter((product) => product.id !== productToDelete));
      setProductToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleBulkDelete = () => {
    setProducts(
      products.filter((product) => !selectedProducts.includes(product.id))
    );
    setSelectedProducts([]);
    setIsBulkDeleteModalOpen(false);
  };

  // Navigation handlers
  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleImportExcel = () => {
    alert("Import Excel functionality will be implemented here");
  };

  // Edit product setup
  const setupEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden mt-5">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h5 className="text-xl font-bold">All Stock</h5>
            <div className="flex gap-2">
              {selectedProducts.length > 0 && (
                <button
                  onClick={confirmBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Selected
                </button>
              )}
              <button
                onClick={handleImportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Upload className="w-5 h-5" />
                Import
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus className="w-5 h-5" />
                Add Product
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
                        selectedProducts.length === products.length &&
                        products.length > 0
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
                {products.map((product) => (
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
                    <td
                      className="px-4 py-2 text-sm text-gray-700 relative cursor-pointer"
                      onClick={() => handleProductClick(product.id)}
                    >
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
                        className={`px-2 py-1 rounded-full text-xs ${
                          product.status === "In Stock"
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
                          onClick={() => setupEditProduct(product)}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(product.id)}
                          className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        categories={CATEGORIES}
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
        categories={CATEGORIES}
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
