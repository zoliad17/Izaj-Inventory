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
  TruckIcon,
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
        return "text-red-400 bg-red-100";
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center p-2 rounded-2xl bg-transparent"
                title="Go Back"
              >
                <ArrowLeft size={24} />
              </button>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TruckIcon className="h-7 w-7 text-blue-600" />
                Requested Items
              </h1>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadSentRequests}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-base font-bold bg-transparent
                 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.6)]
                 dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(60,60,60,0.4)]
                 hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.1),inset_-6px_-6px_12px_rgba(255,255,255,0.5)]
                 dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.7),inset_-6px_-6px_12px_rgba(40,40,40,0.5)]
                 transition-all duration-300 text-blue-600 dark:text-blue-400"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Description */}
          <div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Track the status of your product requests to other branches
            </p>
            <div
              className="mt-2 p-2 rounded-md bg-green-50 dark:bg-green-900/30
                    shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.6)]
                    dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(60,60,60,0.3)]
                    text-gray-500"
            >
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
              <div
                className="text-base text-gray-500 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-2xl
                      shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.6)]
                      dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(60,60,60,0.3)]
                      max-w-md mx-auto"
              >
                <strong>🚀 Ready to request products?</strong>
                <ul className="mt-1 text-left space-y-1">
                  <li>• Browse products from other branches</li>
                  <li>• Add items to your request cart</li>
                  <li>• Submit for Branch Manager approval</li>
                  <li>• Track your requests here</li>
                </ul>
                <button
                  onClick={() => navigate("/branch_location")}
                  className="mt-3 px-4 py-2 rounded-2xl bg-transparent
                     shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.6)]
                     dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(60,60,60,0.4)]
                     hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.1),inset_-6px_-6px_12px_rgba(255,255,255,0.5)]
                     dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.7),inset_-6px_-6px_12px_rgba(40,40,40,0.5)]
                     text-blue-600 dark:text-blue-400 transition-all duration-300"
                >
                  Browse Products
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <div
                  key={request.request_id}
                  className="rounded-2xl p-6 bg-white dark:bg-neutral-800
                     shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.7)]
                     dark:shadow-[6px_6px_12px_rgba(0,0,0,0.7),-6px_-6px_12px_rgba(60,60,60,0.6)]
                     hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.15),inset_-6px_-6px_12px_rgba(255,255,255,0.5)]
                     dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.85),inset_-6px_-6px_12px_rgba(70,70,70,0.7)]
                     transition-all duration-300"
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg text-gray-600 dark:text-gray-400">
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
                  <div
                    className="mb-4 p-4 rounded-2xl bg-gray-50 dark:bg-neutral-700
                          shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
                          dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]"
                  >
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
                        <p className="text-gray-600 text base dark:text-gray-400">
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
                    <div
                      className="mb-4 p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30
                            shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)]
                            dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(60,60,60,0.3)]
                            border border-blue-200 dark:border-blue-800"
                    >
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
                      className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-transparent text-base font-bold
                         shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.6)]
                         dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(60,60,60,0.4)]
                         hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.1),inset_-6px_-6px_12px_rgba(255,255,255,0.5)]
                         dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.7),inset_-6px_-6px_12px_rgba(40,40,40,0.5)]
                         text-blue-600 dark:text-blue-400 transition-all duration-300"
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
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Request Details #{selectedRequest.request_id}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Request Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-base leading-relaxed">
              <div className="space-y-4">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Recipient:
                  </span>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedRequest.recipient.name}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Branch:
                  </span>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedRequest.recipient_branch}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Status:
                  </span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      selectedRequest.status
                    )}`}
                  >
                    {selectedRequest.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Sent Date:
                  </span>
                  <p className="text-gray-900 dark:text-gray-100">
                    {formatDate(selectedRequest.created_at)}
                  </p>
                </div>
                {selectedRequest.reviewed_at && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Reviewed Date:
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      {formatDate(selectedRequest.reviewed_at)}
                    </p>
                  </div>
                )}
                {selectedRequest.reviewer_name && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Reviewed By:
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedRequest.reviewer_name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-3">
                Requested Items
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700 text-base">
                  <thead className="bg-gray-50 dark:bg-neutral-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide text-sm">
                        Product
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide text-sm">
                        Category
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide text-sm">
                        Quantity
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide text-sm">
                        Price
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide text-sm">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
                    {selectedRequest.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                          {item.product_name}
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                          {item.category_name}
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                          ₱{item.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-neutral-800">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-2 text-right font-medium text-gray-900 dark:text-gray-100"
                      >
                        Total Value:
                      </td>
                      <td className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">
                        ₱{getTotalValue(selectedRequest.items).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Review Notes */}
              {selectedRequest.notes && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md mt-4">
                  <h4 className="font-semibold text-base text-blue-700 dark:text-blue-300 mb-2">
                    Review Notes
                  </h4>
                  <p className="text-gray-800 dark:text-gray-200 text-base">
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
                        loadSentRequests();
                        setShowDetailsModal(false);
                      } catch (error) {
                        console.error("Error marking items as arrived:", error);
                        toast.error("Failed to mark items as arrived");
                      }
                    }}
                    className="px-5 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-base font-medium"
                  >
                    <Package className="h-5 w-5" />
                    Mark as Arrived
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className=" bg-gray-600 outline-1 dark:outline-0 text-black dark:text-white mt-5 neumorphic-button-transparent rounded-md hover:bg-gray-700 transition-colors text-base font-medium"
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
