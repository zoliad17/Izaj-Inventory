import { useState, useEffect } from "react";
import {
  Package,
  User,
  MapPin,
  Calendar,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../Sidebar/SidebarContext";
import { useAuth } from "../../contexts/AuthContext";

interface RequestItem {
  id: number;
  quantity: number;
  product_name: string;
  price: number;
  category_name: string;
}

interface SentRequest {
  request_id: number;
  request_to: string;
  status: string;
  created_at: string;
  updated_at?: string;
  reviewed_at?: string;
  arrived_at?: string;
  notes?: string;
  reviewer_name?: string;
  recipient: {
    name: string;
    branch_id: number;
  };
  recipient_branch: string;
  items: RequestItem[];
}

export default function Requested_Item() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<SentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SentRequest | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
      loadSentRequests();
    }
  }, [currentUser]);

  const loadSentRequests = async () => {
    if (!currentUser) {
      console.log("No current user, skipping loadSentRequests");
      return;
    }

    try {
      console.log("Loading sent requests for user:", currentUser.user_id);
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/product-requests/sent/${currentUser.user_id}`
      );
      if (!response.ok) throw new Error("Failed to fetch sent requests");

      const data = await response.json();
      console.log("Sent requests loaded:", data);
      setRequests(data);
    } catch (error) {
      console.error("Error loading sent requests:", error);
      toast.error("Failed to load sent requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (request: SentRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
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
      case "arrived":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle2 className="h-4 w-4" />;
      case "denied":
        return <XCircle className="h-4 w-4" />;
      case "arrived":
        return <Package className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTotalValue = (items: RequestItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading sent requests...</span>
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
                className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Package className="h-7 w-7 text-blue-600" />
                Requested Items
              </h1>
            </div>
            <button
              onClick={loadSentRequests}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
          <div className="ml-12">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Track the status of your product requests to other branches
            </p>
            <div className="mt-2 text-base text-gray-500 bg-green-50 dark:bg-green-900/30 p-2 rounded-md">
              <strong>📊 Request Status:</strong> Monitor your outgoing requests
              and see when they're approved, denied, or still pending review.
            </div>
          </div>
        </div>

        <div className="p-6">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Sent Requests
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                You haven't sent any product requests yet.
              </p>
              <div className="text-base text-gray-500 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md max-w-md mx-auto">
                <strong>🚀 Ready to request products?</strong>
                <ul className="mt-1 text-left space-y-1">
                  <li>• Browse products from other branches</li>
                  <li>• Add items to your request cart</li>
                  <li>• Submit for Branch Manager approval</li>
                  <li>• Track your requests here</li>
                </ul>
                <button
                  onClick={() => navigate("/branch_location")}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base"
                >
                  Browse Products
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.request_id}
                  className="border border-gray-200 dark:border-neutral-600 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          Request #{request.request_id}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusIcon(request.status)}
                          {request.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          <span>
                            <strong>To:</strong> {request.recipient.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          <span>
                            <strong>Branch:</strong> {request.recipient_branch}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          <span>
                            <strong>Sent:</strong>{" "}
                            {formatDate(request.created_at)}
                          </span>
                        </div>
                      </div>

                      {request.reviewed_at && (
                        <div className="mt-2 text-base text-gray-600 dark:text-gray-400">
                          <span>
                            <strong>Reviewed:</strong>{" "}
                            {formatDate(request.reviewed_at)}
                          </span>
                          {request.reviewer_name && (
                            <span className="ml-4">
                              <strong>By:</strong> {request.reviewer_name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Request Summary */}
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-neutral-700 rounded-md">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-base">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Items:
                        </span>
                        <p className="text-gray-600 dark:text-gray-400">
                          {request.items.length}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Total Quantity:
                        </span>
                        <p className="text-gray-600 dark:text-gray-400">
                          {request.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Total Value:
                        </span>
                        <p className="text-gray-600 dark:text-gray-400">
                          ₱{getTotalValue(request.items).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Status:
                        </span>
                        <p
                          className={`font-medium ${
                            getStatusColor(request.status).split(" ")[0]
                          }`}
                        >
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Review Notes */}
                  {request.notes && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-base font-medium text-blue-700 dark:text-blue-300">
                            Review Notes:
                          </p>
                          <p className="text-base text-blue-600 dark:text-blue-400">
                            {request.notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleViewDetails(request)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base"
                    >
                      <Eye className="h-5 w-5" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Request Details #{selectedRequest.request_id}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Request Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-lg text-gray-700">
                    Recipient:
                  </span>
                  <p className="text-gray-700 text-base md:text-lg">
                    {selectedRequest.recipient.name}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-lg text-gray-700">
                    Branch:
                  </span>
                  <p className="text-gray-700 text-base md:text-lg">
                    {selectedRequest.recipient_branch}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-lg text-gray-700">
                    Status:
                  </span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-sm md:text-base font-semibold ${getStatusColor(
                      selectedRequest.status
                    )}`}
                  >
                    {selectedRequest.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-lg text-gray-700">
                    Sent Date:
                  </span>
                  <p className="text-gray-700 text-base md:text-lg">
                    {formatDate(selectedRequest.created_at)}
                  </p>
                </div>
                {selectedRequest.reviewed_at && (
                  <div>
                    <span className="font-semibold text-lg text-gray-700">
                      Reviewed Date:
                    </span>
                    <p className="text-gray-700 text-base md:text-lg">
                      {formatDate(selectedRequest.reviewed_at)}
                    </p>
                  </div>
                )}
                {selectedRequest.reviewer_name && (
                  <div>
                    <span className="font-semibold text-lg text-gray-700">
                      Reviewed By:
                    </span>
                    <p className="text-gray-700 text-base md:text-lg">
                      {selectedRequest.reviewer_name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <h4 className="font-semibold text-xl text-gray-900 mb-3">
                Requested Items:
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-base md:text-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm md:text-base font-semibold text-gray-600 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-2 text-left text-sm md:text-base font-semibold text-gray-600 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-2 text-left text-sm md:text-base font-semibold text-gray-600 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-2 text-left text-sm md:text-base font-semibold text-gray-600 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-2 text-left text-sm md:text-base font-semibold text-gray-600 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedRequest.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-base md:text-lg text-gray-900">
                          {item.product_name}
                        </td>
                        <td className="px-4 py-2 text-base md:text-lg text-gray-700">
                          {item.category_name}
                        </td>
                        <td className="px-4 py-2 text-base md:text-lg text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-base md:text-lg text-gray-900">
                          ₱{item.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-base md:text-lg text-gray-900">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-2 text-base md:text-lg font-semibold text-gray-900 text-right"
                      >
                        Total Value:
                      </td>
                      <td className="px-4 py-2 text-base md:text-lg font-semibold text-gray-900">
                        ₱{getTotalValue(selectedRequest.items).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Review Notes */}
              {selectedRequest.notes && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md mt-4">
                  <h4 className="font-semibold text-lg text-blue-700 dark:text-blue-300 mb-2">
                    Review Notes:
                  </h4>
                  <p className="text-blue-700 dark:text-blue-400 text-base md:text-lg">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end mt-6 gap-3">
                {selectedRequest.status === "approved" && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `http://localhost:5000/api/product-requests/${selectedRequest.request_id}/mark-arrived`,
                          {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              user_id: currentUser?.user_id,
                              branch_id: currentUser?.branch_id,
                            }),
                          }
                        );

                        if (!response.ok) {
                          throw new Error("Failed to mark request as arrived");
                        }

                        toast.success("Items marked as arrived successfully");
                        loadSentRequests(); // Refresh the requests
                        setShowDetailsModal(false);
                      } catch (error) {
                        console.error("Error marking items as arrived:", error);
                        toast.error("Failed to mark items as arrived");
                      }
                    }}
                    className="px-5 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-base md:text-lg font-semibold"
                  >
                    <Package className="h-5 w-5" />
                    Mark as Arrived
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-5 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-base md:text-lg font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
