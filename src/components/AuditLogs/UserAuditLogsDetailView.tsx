import {
  Download,
  ArrowLeft,
  Clock,
  Filter,
  Calendar,
  User,
  Package,
  Building,
  Hash,
  Info,
  Globe,
  Monitor,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../Sidebar/SidebarContext";

// Detailed audit log entry data structure
interface AuditLogDetail {
  id: number;
  user_id: string;
  action: string;
  description: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  old_values?: any;
  new_values?: any;
  notes?: string;
  timestamp: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
    role?: {
      role_name: string;
    };
    branch?: {
      location: string;
    };
  };
}

// Mock detailed data for a specific audit log entry
const auditLogDetail: AuditLogDetail = {
  id: 125,
  user_id: "USR00125",
  action: "PRODUCT_REQUEST_CREATED",
  description: "Created a new product request for LED Bulbs",
  entity_type: "product_requisition",
  entity_id: "REQ00456",
  ip_address: "192.168.1.45",
  user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  old_values: null,
  new_values: {
    product_id: "PRD00789",
    quantity: 50,
    branch_id: "BR002",
    status: "pending",
    notes: "Urgent request for upcoming project",
  },
  notes: "Request submitted for approval by branch manager",
  timestamp: "2024-06-15T14:32:18.000Z",
  created_at: "2024-06-15T14:32:18.000Z",
  user: {
    name: "Alice Wong",
    email: "alice.wong@izajlighting.com",
    role: {
      role_name: "Branch Staff",
    },
    branch: {
      location: "Manila Branch",
    },
  },
};

// Change history data
const changeHistory = [
  {
    id: 1,
    field: "Status",
    oldValue: "Draft",
    newValue: "Pending Approval",
    changedAt: "2024-06-15 14:32:18",
    changedBy: "Alice Wong",
  },
  {
    id: 2,
    field: "Quantity",
    oldValue: "25",
    newValue: "50",
    changedAt: "2024-06-15 14:35:22",
    changedBy: "Alice Wong",
  },
];

// Related activities
const relatedActivities = [
  {
    id: 1,
    action: "PRODUCT_REQUEST_APPROVED",
    description: "Product request approved by branch manager",
    timestamp: "2024-06-15 15:45:30",
    user: "Robert Chen",
  },
  {
    id: 2,
    action: "INVENTORY_TRANSFER",
    description: "50 units of LED Bulbs transferred to Manila Branch",
    timestamp: "2024-06-16 09:15:45",
    user: "System",
  },
];

function getActionColor(action: string) {
  if (action.includes("LOGIN")) return "bg-blue-100 text-blue-800";
  if (action.includes("SETUP")) return "bg-green-100 text-green-800";
  if (action.includes("REQUEST_CREATED"))
    return "bg-yellow-100 text-yellow-800";
  if (action.includes("APPROVED")) return "bg-green-100 text-green-800";
  if (action.includes("DENIED")) return "bg-red-100 text-red-800";
  if (action.includes("TRANSFER")) return "bg-purple-100 text-purple-800";
  if (action.includes("RECEIVE")) return "bg-teal-100 text-teal-800";
  if (action.includes("INVENTORY")) return "bg-indigo-100 text-indigo-800";
  if (action.includes("PRODUCT")) return "bg-orange-100 text-orange-800";
  return "bg-gray-100 text-gray-800";
}

function getActionIcon(action: string) {
  if (action.includes("LOGIN")) return <User className="w-4 h-4" />;
  if (action.includes("SETUP")) return <User className="w-4 h-4" />;
  if (action.includes("REQUEST_CREATED"))
    return <Package className="w-4 h-4" />;
  if (action.includes("APPROVED")) return <Package className="w-4 h-4" />;
  if (action.includes("DENIED")) return <Package className="w-4 h-4" />;
  if (action.includes("TRANSFER")) return <Building className="w-4 h-4" />;
  if (action.includes("RECEIVE")) return <Package className="w-4 h-4" />;
  if (action.includes("INVENTORY")) return <Package className="w-4 h-4" />;
  if (action.includes("PRODUCT")) return <Package className="w-4 h-4" />;
  return <Clock className="w-4 h-4" />;
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString(),
  };
}

export default function UserAuditLogsDetailView() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  const { date, time } = formatTimestamp(auditLogDetail.timestamp);

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="container mx-auto px-4 py-6 rounded-lg mb-3.5 shadow-md bg-white dark:bg-gray-900 transition-colors">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center cursor-pointer text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={24} className="mr-1" />
            </button>
            <div className="flex flex-col">
              <h5 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Clock className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                Activity Log Details
              </h5>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Detailed information for log entry #{auditLogDetail.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="
      flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-base
      text-blue-800 dark:text-blue-500
      bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
      shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)]
      dark:shadow-[6px_6px_12px_rgba(0,0,0,0.7),-6px_-6px_12px_rgba(60,60,60,0.0)]
      hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.15),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]
      dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.85),inset_-6px_-6px_12px_rgba(70,70,70,0.7)]
      hover:scale-[1.05] active:scale-95
      transition-all duration-300
    "
            title="Export to Excel"
          >
            <Download className="w-5 h-5" />
            <span>Export Excel</span>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Primary Details */}
          <div className="lg:col-span-2">
            <div
              className="rounded-2xl bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
              shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.7)]
              dark:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(40,40,40,0.6)]
              transition-all duration-300 p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Activity Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Action:
                  </span>
                  <span
                    className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-xl 
                    shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] 
                    dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.05)] 
                    backdrop-blur-sm ${getActionColor(auditLogDetail.action)}`}
                  >
                    <div className="flex items-center">
                      {getActionIcon(auditLogDetail.action)}
                      <span className="ml-2">
                        {auditLogDetail.action.replace(/_/g, " ")}
                      </span>
                    </div>
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Description:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 max-w-xs text-right">
                    {auditLogDetail.description}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Entity Type:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {auditLogDetail.entity_type}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Entity ID:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 flex items-center">
                    <Hash className="w-4 h-4 mr-1" />
                    {auditLogDetail.entity_id}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Timestamp:
                  </span>
                  <div className="text-right">
                    <div className="text-gray-900 dark:text-gray-100">
                      {date}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                      {time}
                    </div>
                  </div>
                </div>

                {auditLogDetail.notes && (
                  <div className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Notes:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 max-w-xs text-right">
                      {auditLogDetail.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Change History */}
            <div
              className="rounded-2xl bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
              shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.7)]
              dark:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(40,40,40,0.6)]
              transition-all duration-300 p-6 mt-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                Change History
              </h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Field
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Old Value
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        New Value
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Changed At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {changeHistory.map((change) => (
                      <tr
                        key={change.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {change.field}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 line-through">
                          {change.oldValue}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {change.newValue}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          <div>{change.changedAt.split(" ")[0]}</div>
                          <div className="text-xs">
                            {change.changedAt.split(" ")[1]}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Secondary Details */}
          <div>
            {/* User Information */}
            <div
              className="rounded-2xl bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
              shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.7)]
              dark:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(40,40,40,0.6)]
              transition-all duration-300 p-6 mb-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                User Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Name:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {auditLogDetail.user?.name}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Email:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {auditLogDetail.user?.email}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Role:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {auditLogDetail.user?.role?.role_name}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Branch:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    {auditLogDetail.user?.branch?.location}
                  </span>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div
              className="rounded-2xl bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
              shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.7)]
              dark:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(40,40,40,0.6)]
              transition-all duration-300 p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <Monitor className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                System Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    IP Address:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 flex items-center">
                    <Globe className="w-4 h-4 mr-1" />
                    {auditLogDetail.ip_address}
                  </span>
                </div>

                <div className="flex items-start justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    User Agent:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 text-right max-w-[180px] text-sm">
                    {auditLogDetail.user_agent}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Activities */}
            <div
              className="rounded-2xl bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
              shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.7)]
              dark:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(40,40,40,0.6)]
              transition-all duration-300 p-6 mt-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                Related Activities
              </h3>

              <div className="space-y-3">
                {relatedActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5),inset_-2px_-2px_4px_rgba(60,60,60,0.2)]"
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-lg ${getActionColor(
                          activity.action
                        )}`}
                      >
                        {activity.action
                          .replace(/_/g, " ")
                          .split(" ")
                          .slice(0, 2)
                          .join(" ")}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.timestamp.split(" ")[1]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      {activity.description}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      By: {activity.user}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-2xl 
            shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)] 
            dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)] 
            bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 
            font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            Back to Logs
          </button>
        </div>
      </div>
    </div>
  );
}
