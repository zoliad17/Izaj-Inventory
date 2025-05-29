import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import light1 from "/src/assets/image/light1.jpg";
import { useSidebar } from "../Sidebar/SidebarContext";
import { Upload, Plus, Edit, Trash2, X } from "lucide-react";

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

interface NewProduct {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: string;
  status: "In Stock" | "Out of Stock" | "Low Stock";
  description: string;
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
      price: "Php 345.99",
      stock: 100,
      status: "In Stock",
      imageUrl: light1,
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
  const [newProduct, setNewProduct] = useState<NewProduct>({
    id: "",
    name: "",
    category: "",
    price: "",
    stock: "",
    status: "In Stock",
    description: "",
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Toggle product selection for bulk actions
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Toggle select all products
  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product.id));
    }
  };

  // Handle delete confirmation
  const confirmDelete = (productId: string) => {
    setProductToDelete(productId);
    setIsDeleteModalOpen(true);
  };

  // Handle bulk delete confirmation
  const confirmBulkDelete = () => {
    if (selectedProducts.length > 0) {
      setIsBulkDeleteModalOpen(true);
    }
  };

  // Execute delete action
  const handleDelete = () => {
    if (productToDelete) {
      setProducts(products.filter((product) => product.id !== productToDelete));
      setProductToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  // Execute bulk delete action
  const handleBulkDelete = () => {
    setProducts(
      products.filter((product) => !selectedProducts.includes(product.id))
    );
    setSelectedProducts([]);
    setIsBulkDeleteModalOpen(false);
  };

  // Handle edit product
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock.toString(),
      status: product.status,
      description: product.description || "",
    });
    setIsEditModalOpen(true);
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission for new product
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = String(products.length + 1).padStart(3, "0");
    const productToAdd: Product = {
      ...newProduct,
      id: newId,
      stock: Number(newProduct.stock),
      imageUrl: light1,
      detailsPage: `/product/${newId}`,
    };
    setProducts((prev) => [...prev, productToAdd]);
    setIsAddModalOpen(false);
    resetNewProductForm();
  };

  // Handle form submission for editing product
  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      const updatedProducts = products.map((product) =>
        product.id === editingProduct.id
          ? {
              ...product,
              name: newProduct.name,
              category: newProduct.category,
              price: newProduct.price,
              stock: Number(newProduct.stock),
              status: newProduct.status,
              description: newProduct.description,
            }
          : product
      );
      setProducts(updatedProducts);
      setIsEditModalOpen(false);
      resetNewProductForm();
    }
  };

  // Reset new product form
  const resetNewProductForm = () => {
    setNewProduct({
      id: "",
      name: "",
      category: "",
      price: "",
      stock: "",
      status: "In Stock",
      description: "",
    });
  };

  // Handle product click
  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  // Handle Excel import
  const handleImportExcel = () => {
    alert("Import Excel functionality will be implemented here");
  };

  // Render product form (used for both add and edit)
  const renderProductForm = (isEdit: boolean = false) => (
    <form onSubmit={isEdit ? handleEditProductSubmit : handleAddProductSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            type="text"
            name="name"
            value={newProduct.name}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            name="category"
            value={newProduct.category}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <input
            type="number"
            name="price"
            value={newProduct.price}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Quantity
          </label>
          <input
            type="number"
            name="stock"
            value={newProduct.stock}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="status"
            value={newProduct.status}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={newProduct.description}
            onChange={handleInputChange}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex justify-end gap-4">
        <button
          type="button"
          onClick={() =>
            isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false)
          }
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isEdit ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </form>
  );

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
                      {product.price}
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
                          onClick={() => handleEdit(product)}
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

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Add New Product</h2>
            {renderProductForm()}
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            {renderProductForm(true)}
          </div>
        </div>
      )}

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
