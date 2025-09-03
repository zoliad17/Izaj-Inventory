import React, { useState, useEffect } from 'react';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Filter,
    ArrowLeft,
    Plus,
    Trash2,
    Package,
    MapPin,
    Send,
    ShoppingCart,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../backend/Server/Supabase/supabase';
import { toast } from 'react-hot-toast';

interface Product {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    category_name: string;
    status: string;
}

interface RequestItem {
    product_id: number;
    product_name: string;
    quantity: number;
    available_quantity: number;
    price: number;
    category_name: string;
}

interface User {
    user_id: string;
    name: string;
    branch_id: number;
}

interface Branch {
    id: number;
    location: string;
    address?: string;
}

export default function UnifiedProductRequest() {
    const { branchId } = useParams<{ branchId: string }>();
    const navigate = useNavigate();

    // State for products and branch info
    const [products, setProducts] = useState<Product[]>([]);
    const [branchName, setBranchName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // State for filtering and search
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [statusFilter, setStatusFilter] = useState<string>('All');

    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 5;

    // State for request functionality
    const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showRequestSummary, setShowRequestSummary] = useState(false);

    // Load current user
    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const userData = localStorage.getItem('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    setCurrentUser(user);
                }
            } catch (error) {
                console.error('Error loading current user:', error);
                toast.error('Failed to load user data');
            }
        };
        loadCurrentUser();
    }, []);

    // Fetch branch info
    useEffect(() => {
        if (!branchId) return;
        const fetchBranch = async () => {
            try {
                const { data, error } = await supabase
                    .from('branch')
                    .select('location, address')
                    .eq('id', branchId)
                    .single();

                if (!error && data) {
                    setBranchName(data.location);
                }
            } catch (error) {
                console.error('Error fetching branch:', error);
            }
        };
        fetchBranch();
    }, [branchId]);

    // Fetch products
    useEffect(() => {
        if (!branchId) return;
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`http://localhost:5000/api/branches/${branchId}/products`);
                if (!response.ok) throw new Error('Failed to fetch products');

                const data = await response.json();
                setProducts(data);
            } catch (error) {
                console.error('Error loading products:', error);
                toast.error('Failed to load products');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [branchId]);

    // Get unique categories for filter
    const categories = ['All', ...new Set(products.map(p => p.category_name))];
    const statuses = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.id.toString().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === 'All' || product.category_name === categoryFilter;
        const matchesStatus = statusFilter === 'All' || product.status === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Pagination logic
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    // Add product to request
    const addToRequest = (product: Product) => {
        const existingItem = requestItems.find(item => item.product_id === product.id);

        if (existingItem) {
            toast.error('Product already in request list');
            return;
        }

        if (product.quantity <= 0) {
            toast.error('Product is out of stock');
            return;
        }

        const newItem: RequestItem = {
            product_id: product.id,
            product_name: product.product_name,
            quantity: 1,
            available_quantity: product.quantity,
            price: product.price,
            category_name: product.category_name
        };

        setRequestItems([...requestItems, newItem]);
        toast.success('Product added to request');
    };

    // Remove product from request
    const removeFromRequest = (productId: number) => {
        setRequestItems(requestItems.filter(item => item.product_id !== productId));
    };

    // Update quantity in request
    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) return;

        setRequestItems(requestItems.map(item =>
            item.product_id === productId
                ? { ...item, quantity: Math.min(quantity, item.available_quantity) }
                : item
        ));
    };

    // Validate and submit request
    const handleSubmitRequest = async () => {
        if (!currentUser || !branchId) {
            toast.error('User information not found');
            return;
        }

        if (requestItems.length === 0) {
            toast.error('Please add at least one product to request');
            return;
        }

        try {
            setIsSubmitting(true);

            // Find the branch manager of the selected branch
            const branchManagerResponse = await fetch(`http://localhost:5000/api/users?branch_id=${branchId}`);
            if (!branchManagerResponse.ok) throw new Error('Failed to fetch users');

            const users = await branchManagerResponse.json();
            const branchManager = users.find((user: any) =>
                user.branch_id === Number(branchId) &&
                (user.role?.role_name === 'Branch Manager' || user.role?.role_name === 'BranchManager')
            );

            if (!branchManager) {
                toast.error('No branch manager found for the selected branch');
                return;
            }

            const requestData = {
                requestFrom: currentUser.user_id,
                requestTo: branchManager.user_id,
                items: requestItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                })),
                notes: notes.trim() || null
            };

            const response = await fetch('http://localhost:5000/api/product-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit request');
            }

            await response.json();

            toast.success('Product request submitted successfully!');

            // Reset form
            setRequestItems([]);
            setNotes('');
            setShowRequestSummary(false);

            // Navigate back to branch location
            navigate('/branch_location');

        } catch (error) {
            console.error('Error submitting request:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Mock export function
    const mockExport = () => {
        alert('Export to Excel functionality would be implemented here in a real application');
        console.log('Data that would be exported:', filteredProducts);
    };

    if (isLoading) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading products...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/branch_location')}
                                className="flex items-center cursor-pointer gap-2 text-gray-800 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Package className="h-6 w-6 text-blue-600" />
                                    {branchName} - Browse & Request Products
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Browse available products and add them to your request
                                </p>
                            </div>
                        </div>

                        {/* Request Summary Button */}
                        {requestItems.length > 0 && (
                            <button
                                onClick={() => setShowRequestSummary(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Request Cart ({requestItems.length})
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg">
                                <Filter className="h-4 w-4" />
                                <select
                                    className="text-sm focus:outline-none"
                                    value={categoryFilter}
                                    onChange={(e) => {
                                        setCategoryFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg">
                                <Filter className="h-4 w-4" />
                                <select
                                    className="text-sm focus:outline-none"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    {statuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={mockExport}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Available
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentProducts.length > 0 ? (
                                    currentProducts.map((product) => {
                                        const isInRequest = requestItems.some(item => item.product_id === product.id);
                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {product.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.product_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.category_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    ₱{product.price.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.quantity}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                                                        product.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {product.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {isInRequest ? (
                                                        <span className="text-green-600 flex items-center gap-1">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            In Cart
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => addToRequest(product)}
                                                            disabled={product.quantity <= 0}
                                                            className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                        >
                                                            Add to Request
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No products found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{indexOfFirstProduct + 1}</span> to{' '}
                                        <span className="font-medium">{Math.min(indexOfLastProduct, filteredProducts.length)}</span> of{' '}
                                        <span className="font-medium">{filteredProducts.length}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Request Summary Modal */}
            {showRequestSummary && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Request Summary
                            </h3>
                            <button
                                onClick={() => setShowRequestSummary(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Branch Info */}
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-900">Requesting from:</span>
                                <span className="text-blue-700">{branchName}</span>
                            </div>
                        </div>

                        {/* Request Items */}
                        <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-3">Request Items:</h4>
                            <div className="space-y-3">
                                {requestItems.map((item) => (
                                    <div key={item.product_id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h5 className="font-medium text-gray-900">{item.product_name}</h5>
                                                <p className="text-sm text-gray-600">{item.category_name}</p>
                                                <p className="text-sm text-gray-600">₱{item.price.toFixed(2)} each</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.available_quantity}
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const newQuantity = parseInt(e.target.value) || 1;
                                                            updateQuantity(item.product_id, newQuantity);
                                                        }}
                                                        className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <button
                                                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromRequest(item.product_id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600">
                                            Available: {item.available_quantity} | Total: ₱{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Add any additional information about this request..."
                            />
                        </div>

                        {/* Summary */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-md">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">Total Items:</span>
                                    <p className="text-gray-600">{requestItems.length}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Total Quantity:</span>
                                    <p className="text-gray-600">{requestItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Estimated Value:</span>
                                    <p className="text-gray-600">₱{requestItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowRequestSummary(false)}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitRequest}
                                disabled={isSubmitting || requestItems.length === 0}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Submit Request
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
