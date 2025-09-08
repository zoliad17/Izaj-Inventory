import { useNavigate } from "react-router-dom";
import { LocationMarkerIcon, PlusIcon, PencilIcon, TrashIcon, XIcon } from "@heroicons/react/outline";
import { useSidebar } from "../Sidebar/SidebarContext";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Branch, BranchFormData } from "../../types";

function AdminBranchManagement() {
    const navigate = useNavigate();
    const { isCollapsed } = useSidebar();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<BranchFormData>({
        location: '',
        address: ''
    });

    // Reuse the same fetch logic as Branch_location.tsx
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/branches");
                if (!response.ok) throw new Error("Failed to fetch branches");
                const data = await response.json();
                setBranches(data || []);
            } catch (error) {
                console.error("Failed to fetch branches:", error);
                toast.error("Failed to load branches");
                setBranches([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBranches();
    }, []);

    const handleEditBranch = (branch: Branch) => {
        setEditingBranch(branch);
        setFormData({
            location: branch.location,
            address: branch.address || ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteBranch = async (branchId: number) => {
        if (!window.confirm("Are you sure you want to delete this branch?")) return;

        try {
            const response = await fetch(`http://localhost:5000/api/branches/${branchId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete branch");

            // Remove from local state
            setBranches(prev => prev.filter(branch => branch.id !== branchId));
            toast.success("Branch deleted successfully");
        } catch (error) {
            console.error("Error deleting branch:", error);
            toast.error("Failed to delete branch");
        }
    };

    const handleAddBranch = () => {
        setEditingBranch(null);
        setFormData({
            location: '',
            address: ''
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBranch(null);
        setFormData({
            location: '',
            address: ''
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = editingBranch
                ? `http://localhost:5000/api/branches/${editingBranch.id}`
                : 'http://localhost:5000/api/branches';

            const method = editingBranch ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${editingBranch ? 'update' : 'add'} branch`);
            }

            const result = await response.json();

            if (editingBranch) {
                // Update existing branch in state
                setBranches(prev => prev.map(branch =>
                    branch.id === editingBranch.id
                        ? { ...branch, location: formData.location, address: formData.address }
                        : branch
                ));
                toast.success('Branch updated successfully!');
            } else {
                // Add new branch to state
                setBranches(prev => [...prev, result]);
                toast.success('Branch added successfully!');
            }

            handleCloseModal();
        } catch (error) {
            console.error(`Error ${editingBranch ? 'updating' : 'adding'} branch:`, error);
            toast.error(
                error instanceof Error ? error.message : `Failed to ${editingBranch ? 'update' : 'add'} branch`
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className={`transition-all duration-300 ${isCollapsed ? "ml-5" : "ml-1"} p-2 sm:p-4 dark:bg-neutral-950`}
        >
            {/* Header - Reuse same structure as Branch_location.tsx */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex items-center gap-4 mb-2.5 mt-2.5">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h5 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Branch Management
                    </h5>
                </div>
                <button
                    onClick={handleAddBranch}
                    className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
                >
                    <PlusIcon className="h-5 w-5" />
                    Add Branch
                </button>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : branches.length === 0 ? (
                <div className="mt-5 p-6 text-center text-gray-500 dark:text-gray-400">
                    <p>No branches found.</p>
                </div>
            ) : (
                /* Grid Layout - Reuse same structure as Branch_location.tsx */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                    {branches.map((branch) => (
                        <div key={branch.id} className="col flex flex-col">
                            <div className="card h-full bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden outline-1 flex flex-col border border-gray-200 dark:border-neutral-700">
                                {/* Branch Image - Reuse same styling */}
                                <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <LocationMarkerIcon className="h-16 w-16 text-white" />
                                </div>

                                {/* Content - Reuse same structure */}
                                <div className="p-6 flex-grow">
                                    <h5 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                                        {branch.location}
                                    </h5>

                                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                                        <LocationMarkerIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-500" />
                                        <span>{branch.address || "No address provided"}</span>
                                    </div>

                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        ID: {branch.id}
                                    </div>
                                </div>

                                {/* Actions - Admin-specific */}
                                <div className="p-4 bg-gray-100 dark:bg-neutral-700 mt-auto">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditBranch(branch)}
                                            className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition duration-300 flex items-center justify-center gap-2"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBranch(branch.id)}
                                            className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-300 flex items-center justify-center gap-2"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Branch Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <XIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label
                                    htmlFor="location"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >
                                    Branch Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="e.g., Northwest Regional Office"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="address"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >
                                    Full Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Street, City, State, ZIP"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting
                                        ? (editingBranch ? 'Updating...' : 'Adding...')
                                        : (editingBranch ? 'Update Branch' : 'Add Branch')
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminBranchManagement;
