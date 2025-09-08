import { CheckCircle, Package, Calendar, DollarSign, Clipboard, Clock } from 'lucide-react';

interface SuccessNotificationProps {
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    requestId: string;
    branchName: string;
    onClose?: () => void;
}

export default function SuccessNotification({
    totalItems,
    totalQuantity,
    totalValue,
    requestId,
    branchName,
    onClose
}: SuccessNotificationProps) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-2xl p-6 text-white relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>

                    {/* Success icon and title */}
                    <div className="relative z-10 flex items-center gap-3 mb-4">
                        <div className="bg-white bg-opacity-20 p-3 rounded-full">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Request Submitted!</h2>
                            <p className="text-green-100 text-sm">Your request has been successfully submitted</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Request details */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-3">Request Summary</h3>

                        {/* Items count */}
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Items</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                                </p>
                            </div>
                        </div>

                        {/* Total quantity */}
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Quantity</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{totalQuantity}</p>
                            </div>
                        </div>

                        {/* Estimated value */}
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
                                <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Value</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">₱{totalValue.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Request ID */}
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 dark:bg-gray-600 p-2 rounded-lg">
                                <Clipboard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Request ID</p>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">#{requestId}</p>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-lg">
                                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Status</p>
                                <p className="text-amber-700 dark:text-amber-300">
                                    Awaiting approval from {branchName} Branch Manager
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                            Continue
                        </button>
                        <button
                            onClick={() => window.location.href = '/requested_item'}
                            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-xl transition-all duration-200"
                        >
                            View Requests
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
