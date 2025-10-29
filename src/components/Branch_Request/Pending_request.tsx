import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Package,
  User,
  MapPin,
  Calendar,
  MessageSquare,
  RefreshCw,
  ArrowLeft,
  TruckIcon,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../Sidebar/SidebarContext";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/config";

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

export default function PendingRequest() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(
    null
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<
    "approved" | "denied" | null
  >(null);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      console.error("User not authenticated or user data missing");
      toast.error("Please log in to continue");
      navigate("/login");
    }
  }, [isAuthenticated, currentUser, navigate]);

  useEffect(() => {
    if (currentUser) {
      loadPendingRequests();
    }
  }, [currentUser]);

  const loadPendingRequests = async () => {
    if (!currentUser) {
      console.log("No current user, skipping loadPendingRequests");
      return;
    }

    try {
      console.log("Loading pending requests for user:", currentUser.user_id);
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/product-requests/pending/${currentUser.user_id}`
      );
      if (!response.ok) throw new Error("Failed to fetch pending requests");

      const data = await response.json();
      console.log("Pending requests loaded:", data);
      setRequests(data);
    } catch (error) {
      console.error("Error loading pending requests:", error);
      toast.error("Failed to load pending requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewRequest = (
    request: PendingRequest,
    action: "approved" | "denied"
  ) => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes("");
    setShowReviewModal(true);
  };

  const confirmReview = async () => {
    if (!selectedRequest || !reviewAction || !currentUser) return;

    try {
      setIsProcessing(selectedRequest.request_id);

      const response = await fetch(
        `${API_BASE_URL}/api/product-requests/${selectedRequest.request_id}/review`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: reviewAction,
            reviewedBy: currentUser.user_id,
            notes: reviewNotes.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process request");
      }

      await response.json();

      toast.success(`Request ${reviewAction} successfully!`);

      // Remove the processed request from the list
      setRequests(
        requests.filter((req) => req.request_id !== selectedRequest.request_id)
      );

      // Close modal
      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewAction(null);
      setReviewNotes("");
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process request"
      );
    } finally {
      setIsProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "approved":
        return "text-green-600 bg-green-100";
      case "denied":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">
            Loading pending requests...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
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
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TruckIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                Pending Requests
              </h1>
            </div>
            <button
              onClick={loadPendingRequests}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-base font-bold bg-transparent
                 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.6)]
                 dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(60,60,60,0.4)]
                 hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.1),inset_-6px_-6px_12px_rgba(255,255,255,0.5)]
                 dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.7),inset_-6px_-6px_12px_rgba(40,40,40,0.5)]
                 text-blue-600 dark:text-blue-400 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            Review and approve/deny product requests from other branches
          </p>

          <div
            className="mt-2 text-base text-gray-500 dark:text-gray-300
                  bg-blue-50 dark:bg-blue-900/30 p-2 rounded-2xl
                  shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
                  dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]"
          >
            <strong>📋 Review Process:</strong> As a Branch Manager, you can
            approve or deny incoming product requests. Approved requests will
            transfer inventory to the requesting branch.
          </div>
        </div>

        <div className="p-6">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-20 w-20 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Pending Requests
              </h3>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                You don't have any pending product requests at the moment.
              </p>
              <div
                className="text-lg text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-neutral-800 p-3 rounded-2xl
                      shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
                      dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(60,60,60,0.3)] max-w-md mx-auto"
              >
                <strong>💡 What happens next?</strong>
                <ul className="mt-1 text-left space-y-1">
                  <li>
                    • Other branches can request products from your inventory
                  </li>
                  <li>
                    • You'll receive notifications when new requests arrive
                  </li>
                  <li>• Review and approve/deny requests as needed</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <div
                  key={request.request_id}
                  className="rounded-2xl p-6 bg-white dark:bg-neutral-800
                     shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.6)]
                     dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(60,60,60,0.4)]
                     transition-shadow hover:shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.5)]
                     dark:hover:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(40,40,40,0.5)]"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                          Request #{request.request_id}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-base font-medium ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <User className="h-6 w-6" />
                          <span>
                            <strong>From:</strong> {request.requester.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-6 w-6" />
                          <span>
                            <strong>Branch:</strong> {request.requester_branch}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-6 w-6" />
                          <span>
                            <strong>Date:</strong>{" "}
                            {formatDate(request.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requested Items Table */}
                  <div className="mb-4 overflow-x-auto rounded-2xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                      <thead className="bg-gray-50 dark:bg-neutral-700">
                        <tr>
                          {[
                            "Product",
                            "Category",
                            "Requested",
                            "Available",
                            "Price",
                            "Total",
                          ].map((col) => (
                            <th
                              key={col}
                              className="px-5 py-4 text-left text-base font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                        {request.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-5 py-4 text-base font-medium text-gray-900 dark:text-gray-100">
                              {item.product_name}
                            </td>
                            <td className="px-5 py-4 text-base text-gray-700 dark:text-gray-300">
                              {item.category_name}
                            </td>
                            <td className="px-5 py-4 text-base font-medium text-gray-900 dark:text-gray-100">
                              {item.quantity}
                            </td>
                            <td className="px-5 py-4 text-base">
                              <span
                                className={`${
                                  item.quantity <= item.available_quantity
                                    ? "text-green-700 dark:text-green-500 font-semibold"
                                    : "text-red-700 dark:text-red-500 font-semibold"
                                }`}
                              >
                                {item.available_quantity}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-base font-medium text-gray-900 dark:text-gray-100">
                              ₱{item.price.toFixed(2)}
                            </td>
                            <td className="px-5 py-4 text-base font-medium text-gray-900 dark:text-gray-100">
                              ₱{(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div
                      className="mb-4 p-3 bg-gray-50 dark:bg-neutral-700 rounded-2xl
                            shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
                            dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]"
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-6 w-6 text-gray-500 dark:text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                            Notes:
                          </p>
                          <p className="text-base text-gray-600 dark:text-gray-400">
                            {request.notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleReviewRequest(request, "denied")}
                      disabled={isProcessing === request.request_id}
                      className="flex items-center gap-2 px-5 py-2.5 text-lg font-bold text-red-600 dark:text-red-500
                          neumorphic-button-transparent outline-1 dark:outline-0
                        "
                    >
                      <XCircle className="h-6 w-6" />
                      Deny
                    </button>
                    <button
                      onClick={() => handleReviewRequest(request, "approved")}
                      disabled={isProcessing === request.request_id}
                      className="flex items-center gap-2 px-5 py-2.5 text-lg font-bold text-green-600
     rounded-2xl
     neumorphic-button-transparent outline-1 dark:outline-0"
                    >
                      <CheckCircle2 className="h-6 w-6" />
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedRequest && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-2 mb-4">
                {reviewAction === "approved" ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {reviewAction === "approved" ? "Approve" : "Deny"} Request #
                  {selectedRequest.request_id}
                </h3>
              </div>

              <div className="mb-4">
                <p className="text-base text-gray-600 dark:text-gray-400 mb-3">
                  Are you sure you want to {reviewAction} this request from{" "}
                  {selectedRequest.requester.name}?
                </p>

                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Review Notes (Optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                  placeholder={`Add notes for ${
                    reviewAction === "approved" ? "approval" : "denial"
                  }...`}
                />
              </div>

              <div className="flex justify-end gap-3">
                {/* Cancel Button */}
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl text-red-700 dark:text-red-400 font-bold
               bg-transparent  outline-1 outline-red-300 dark:outline-red-500
               shadow-[inset_2px_2px_6px_rgba(0,0,0,0.05),inset_-2px_-2px_6px_rgba(255,255,255,0.7)]
               dark:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.7),inset_-2px_-2px_6px_rgba(60,60,60,0.3)]
               hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.1),inset_-4px_-4px_10px_rgba(255,255,255,0.5)]
               dark:hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.8),inset_-4px_-4px_10px_rgba(40,40,40,0.5)]
               active:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.5)]
               transition-all duration-300 text-base"
                >
                  Cancel
                </button>

                {/* Confirm Button */}
                <button
                  onClick={confirmReview}
                  disabled={isProcessing === selectedRequest.request_id}
                  className={`px-4 py-2 rounded-xl text-base font-bold transition-all duration-300
                bg-transparent  outline-1 
                ${
                  reviewAction === "approved"
                    ? "outline-green-300 dark:outline-green-500 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                    : "outline-red-300 dark:outline-red-500 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                }
                shadow-[inset_2px_2px_6px_rgba(0,0,0,0.05),inset_-2px_-2px_6px_rgba(255,255,255,0.7)]
                dark:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.7),inset_-2px_-2px_6px_rgba(60,60,60,0.3)]
                hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.1),inset_-4px_-4px_10px_rgba(255,255,255,0.5)]
                dark:hover:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.8),inset_-4px_-4px_10px_rgba(40,40,40,0.5)]
                active:shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.5)]
                disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isProcessing === selectedRequest.request_id ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Processing...
                    </div>
                  ) : (
                    `Confirm ${
                      reviewAction === "approved" ? "Approval" : "Denial"
                    }`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
