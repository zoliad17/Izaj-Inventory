import {
  Download,
  ArrowLeft,
  Clock,
  // Filter,
  // Calendar,
  User,
  Package,
  Building,
  Hash,
  Info,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useSidebar } from "../Sidebar/SidebarContext";
import { API_BASE_URL } from "../../config/config";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";

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
  // Flat fields from database view
  user_name?: string;
  user_email?: string;
  user_status?: string;
  role_name?: string;
  branch_location?: string;
  branch_address?: string;
  // Nested structure for compatibility
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

// Helper function to parse change history from old_values and new_values
function parseChangeHistory(oldValues: any, newValues: any): any[] {
  if (!oldValues || !newValues) return [];

  const changes: any[] = [];
  const keys = Object.keys(newValues);

  keys.forEach((key) => {
    const oldVal = oldValues[key];
    const newVal = newValues[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        id: changes.length + 1,
        field: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
        oldValue:
          oldVal !== null && oldVal !== undefined ? String(oldVal) : "-",
        newValue:
          newVal !== null && newVal !== undefined ? String(newVal) : "-",
        changedAt: new Date().toLocaleString(),
        changedBy: "System",
      });
    }
  });

  return changes;
}

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
  const { id } = useParams<{ id: string }>();
  const [auditLogDetail, setAuditLogDetail] = useState<AuditLogDetail | null>(
    null
  );
  const [changeHistory, setChangeHistory] = useState<any[]>([]);
  const [relatedActivities, setRelatedActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleExport = () => {
    try {
      if (!auditLogDetail) return;

      // Summary sheet
      const summary = [
        {
          "Log ID": auditLogDetail.id,
          Action: auditLogDetail.action,
          Description: auditLogDetail.description,
          "Entity Type": auditLogDetail.entity_type || "",
          "Entity ID": auditLogDetail.entity_id || "",
          Timestamp: new Date(auditLogDetail.timestamp).toLocaleString(),
          "User Name":
            auditLogDetail.user?.name || auditLogDetail.user_name || "",
          "User Email":
            auditLogDetail.user?.email || auditLogDetail.user_email || "",
          Role:
            auditLogDetail.user?.role?.role_name ||
            auditLogDetail.role_name ||
            "",
          Branch:
            auditLogDetail.user?.branch?.location ||
            auditLogDetail.branch_location ||
            "",
          Notes: auditLogDetail.notes || "",
        },
      ];

      // Change history sheet
      const changes = changeHistory.map((c) => ({
        Field: c.field,
        "Old Value": c.oldValue,
        "New Value": c.newValue,
        "Changed At": c.changedAt,
        "Changed By": c.changedBy,
      }));

      // Raw values sheet (flatten JSON to strings)
      const rawValues = [
        {
          old_values: JSON.stringify(auditLogDetail.old_values ?? {}, null, 2),
          new_values: JSON.stringify(auditLogDetail.new_values ?? {}, null, 2),
        },
      ];

      // Related activities sheet
      const related = relatedActivities.map((r) => ({
        "Log ID": r.id,
        Action: r.action,
        Description: r.description,
        Timestamp: r.timestamp,
        User: r.user,
      }));

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
      const wsChanges = XLSX.utils.json_to_sheet(changes);
      XLSX.utils.book_append_sheet(wb, wsChanges, "Change History");
      const wsRaw = XLSX.utils.json_to_sheet(rawValues);
      XLSX.utils.book_append_sheet(wb, wsRaw, "Raw Values");
      const wsRelated = XLSX.utils.json_to_sheet(related);
      XLSX.utils.book_append_sheet(wb, wsRelated, "Related");

      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `audit_log_${auditLogDetail.id}_${dateStr}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Error exporting audit log:", error);
      toast.error("Failed to export audit log");
    }
  };

  useEffect(() => {
    const fetchAuditLogDetail = async () => {
      if (!id) {
        toast.error("Invalid log ID");
        navigate(-1);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch the audit log detail
        const response = await fetch(`${API_BASE_URL}/api/audit-logs/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch audit log: ${response.status}`);
        }

        const data = await response.json();

        // Transform flat structure to nested structure for compatibility
        const transformedData: AuditLogDetail = {
          ...data,
          user: {
            name: data.user_name || "",
            email: data.user_email || "",
            role: {
              role_name: data.role_name || "",
            },
            branch: {
              location: data.branch_location || "",
            },
          },
        };

        setAuditLogDetail(transformedData);

        // Parse change history from old_values and new_values
        if (data.old_values && data.new_values) {
          const changes = parseChangeHistory(data.old_values, data.new_values);
          setChangeHistory(changes);
        }

        // Fetch related activities for the same entity
        if (data.entity_type && data.entity_id) {
          const relatedResponse = await fetch(
            `${API_BASE_URL}/api/audit-logs/related/${data.entity_type}/${data.entity_id}`
          );

          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            // Filter out the current log and transform
            const filtered = relatedData
              .filter((log: any) => log.id !== parseInt(id))
              .slice(0, 2)
              .map((log: any) => ({
                id: log.id,
                action: log.action,
                description: log.description || log.action.replace(/_/g, " "),
                timestamp: new Date(log.timestamp).toLocaleString(),
                user: log.user_name || "Unknown User",
              }));
            setRelatedActivities(filtered);
          }
        }
      } catch (error) {
        console.error("Error fetching audit log detail:", error);
        toast.error("Failed to load audit log details");
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuditLogDetail();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "ml-5" : "ml-1"
        } p-2 sm:p-4`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Loading audit log details...
          </span>
        </div>
      </div>
    );
  }

  if (!auditLogDetail) {
    return (
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "ml-5" : "ml-1"
        } p-2 sm:p-4`}
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600 dark:text-gray-400">
            Audit log not found
          </p>
        </div>
      </div>
    );
  }

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
            onClick={handleExport}
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
                    {auditLogDetail.user?.name ||
                      auditLogDetail.user_name ||
                      "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Email:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {auditLogDetail.user?.email ||
                      auditLogDetail.user_email ||
                      "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Role:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {auditLogDetail.user?.role?.role_name ||
                      auditLogDetail.role_name ||
                      "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Branch:
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    {auditLogDetail.user?.branch?.location ||
                      auditLogDetail.branch_location ||
                      "—"}
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
