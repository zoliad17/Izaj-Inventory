import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Package,
  User,
  MapPin,
  Calendar,
  MessageSquare,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../Sidebar/SidebarContext';

interface RequestItem {
  id: number;
  quantity: number;
  product_name: string;
  available_quantity: number;
  price: number;
  category_name: string;
}

interface PendingRequest {
  request_id: number;
  request_from: string;
  status: string;
  created_at: string;
  notes?: string;
  requester: {
    name: string;
    email: string;
    branch_id: number;
  };
  requester_branch: string;
  items: RequestItem[];
}

interface User {
  user_id: string;
  name: string;
  branch_id: number;
}

export default function PendingRequest() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approved' | 'denied' | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadPendingRequests();
    }
  }, [currentUser]);

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

  const loadPendingRequests = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5000/api/product-requests/pending/${currentUser.user_id}`);
      if (!response.ok) throw new Error('Failed to fetch pending requests');

      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      toast.error('Failed to load pending requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewRequest = (request: PendingRequest, action: 'approved' | 'denied') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const confirmReview = async () => {
    if (!selectedRequest || !reviewAction || !currentUser) return;

    try {
      setIsProcessing(selectedRequest.request_id);

      const response = await fetch(`http://localhost:5000/api/product-requests/${selectedRequest.request_id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: reviewAction,
          reviewedBy: currentUser.user_id,
          notes: reviewNotes.trim() || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process request');
      }

      await response.json();

      toast.success(`Request ${reviewAction} successfully!`);

      // Remove the processed request from the list
      setRequests(requests.filter(req => req.request_id !== selectedRequest.request_id));

      // Close modal
      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewAction(null);
      setReviewNotes('');

    } catch (error) {
      console.error('Error processing request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process request');
    } finally {
      setIsProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'denied': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading pending requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-300 ${isCollapsed ? "ml-5" : "ml-1"
        } p-2 sm:p-4 dark:bg-neutral-900 min-h-screen`}
    >
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-neutral-700">
        {/* Toaster for success and error */}
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Package className="h-6 w-6 text-blue-600" />
                  Pending Requests
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Review and approve/deny product requests from other branches
                </p>
              </div>
            </div>
            <button
              onClick={loadPendingRequests}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="p-6">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
              <p className="text-gray-600">You don't have any pending product requests at the moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <div key={request.request_id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Request #{request.request_id}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span><strong>From:</strong> {request.requester.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span><strong>Branch:</strong> {request.requester_branch}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span><strong>Date:</strong> {formatDate(request.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Request Items */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-3">Requested Items:</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Requested
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Available
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {request.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {item.product_name}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {item.category_name}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <span className={`${item.quantity <= item.available_quantity ? 'text-green-600' : 'text-red-600'}`}>
                                  {item.available_quantity}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                ₱{item.price.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                ₱{(item.price * item.quantity).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Notes:</p>
                          <p className="text-sm text-gray-600">{request.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleReviewRequest(request, 'denied')}
                      disabled={isProcessing === request.request_id}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      Deny
                    </button>
                    <button
                      onClick={() => handleReviewRequest(request, 'approved')}
                      disabled={isProcessing === request.request_id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              {reviewAction === 'approved' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {reviewAction === 'approved' ? 'Approve' : 'Deny'} Request #{selectedRequest.request_id}
              </h3>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Are you sure you want to {reviewAction} this request from {selectedRequest.requester.name}?
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes (Optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Add notes for ${reviewAction === 'approved' ? 'approval' : 'denial'}...`}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReview}
                disabled={isProcessing === selectedRequest.request_id}
                className={`px-4 py-2 text-white rounded-md transition-colors ${reviewAction === 'approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing === selectedRequest.request_id ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  `Confirm ${reviewAction === 'approved' ? 'Approval' : 'Denial'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
