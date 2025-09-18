import React from "react";
import {
  X,
  User,
  Activity,
  Package,
  Clock,
  Monitor,
  Globe,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";

interface AuditLogDetail {
  id: number;
  timestamp: string;
  action: string;
  description: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
  metadata?: any;
  old_values?: any;
  new_values?: any;
  // Request-specific fields
  request_id?: string;
  request_status?: string;
  requester_name?: string;
  requester_role?: string;
  requester_branch?: string;
  request_date?: string;
  requested_items?: {
    product_name: string;
    quantity: number;
    unit: string;
    status: string;
  }[];
  approver_name?: string;
  approval_date?: string;
  rejected_reason?: string;
  user_id: string;  // UUID of the user who performed the action
  user_name?: string;
  user_email?: string;
  user_status?: string;
  role_name?: string;
  role_id?: number;
  branch_id?: number;
  branch_location?: string;
  branch_address?: string;
  action_category?: string;
  severity_level?: string;
  seconds_ago?: number;
  time_period?: string;
  // Additional user-related fields
  department?: string;
  last_login?: string;
  created_at?: string;
}

interface AuditLogDetailViewProps {
  log: AuditLogDetail;
  onClose: () => void;
}

const AuditLogDetailView: React.FC<AuditLogDetailViewProps> = ({
  log,
  onClose,
}) => {
  const [expandedSections, setExpandedSections] = React.useState({
    metadata: false,
    oldValues: false,
    newValues: false,
    technical: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getSeverityIcon = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "medium":
        return <Info className="w-5 h-5 text-yellow-500" />;
      case "low":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "bg-red-50 border-red-200 text-red-800";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "low":
        return "bg-green-50 border-green-200 text-green-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  };

  const formatTimeAgo = (seconds: number) => {
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };



  const { date, time } = formatTimestamp(log.timestamp);

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {getSeverityIcon(log.severity_level || "medium")}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Audit Log Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ID: {log.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Action
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {log.action}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Description
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {log.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Entity
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {log.entity_type} {log.entity_id && `#${log.entity_id}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Timestamp
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {date} at {time}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {log.seconds_ago && formatTimeAgo(log.seconds_ago)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                      log.severity_level || "medium"
                    )}`}
                  >
                    {log.severity_level || "Medium"} Severity
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {log.action_category || "Other"}
                  </div>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                User Information
              </h3>
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Personal Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Full Name
                      </p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {log.user_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ID: {log.user_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Email Address
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {log.user_email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Role Information
                      </p>
                      <p className="text-gray-900 dark:text-white capitalize">
                        {log.role_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Role ID: {log.role_id}
                      </p>
                    </div>
                    {log.department && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Department
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {log.department}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Account Status
                      </p>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${log.user_status?.toLowerCase() === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`
                      }>
                        {log.user_status}
                      </div>
                    </div>
                    {log.created_at && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Account Created
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(log.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Branch Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Branch Details
                  </h4>
                  <div className="grid grid-cols-1 gap-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Branch Information
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {log.branch_location}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Branch ID: {log.branch_id}
                      </p>
                    </div>
                    {log.branch_address && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Branch Address
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {log.branch_address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Context */}
                {(log.action_category || log.time_period || log.seconds_ago) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Action Context
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                      {log.action_category && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Activity Type
                          </p>
                          <p className="text-gray-900 dark:text-white capitalize">
                            {log.action_category}
                          </p>
                        </div>
                      )}
                      {(log.time_period || log.seconds_ago) && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Time Period
                          </p>
                          <p className="text-gray-900 dark:text-white">
                            {log.time_period || (log.seconds_ago && formatTimeAgo(log.seconds_ago))}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <button
                onClick={() => toggleSection("technical")}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Monitor className="w-5 h-5 mr-2" />
                  Technical Information
                </h3>
                {expandedSections.technical ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {expandedSections.technical && (
                <div className="mt-4 space-y-6">
                  {/* Connection Info */}
                  <div className="space-y-4">
                    {log.ip_address && (
                      <div className="flex items-center space-x-3">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            IP Address
                          </p>
                          <p className="text-gray-900 dark:text-white font-mono">
                            {log.ip_address}
                          </p>
                        </div>
                      </div>
                    )}

                    {log.user_agent && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          User Agent
                        </p>
                        <p className="text-gray-900 dark:text-white text-sm break-all">
                          {log.user_agent}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Data Changes Section */}
                  {(log.metadata || log.old_values || log.new_values) && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        Data Changes
                      </h4>
                      
                      {/* Request Information */}
                      {log.entity_type === 'product_requisition' && (
                        <div className="mb-4 space-y-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Request Information
                          </h5>
                          
                          {/* Request Overview */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Request ID
                                </p>
                                <p className="text-base text-gray-900 dark:text-white font-medium">
                                  {log.request_id || log.entity_id}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Status
                                </p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  log.request_status?.toLowerCase() === 'approved' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : log.request_status?.toLowerCase() === 'rejected'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                  {log.request_status}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Requester Information
                                </p>
                                <p className="text-base text-gray-900 dark:text-white">
                                  {log.requester_name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {log.requester_role} • {log.requester_branch}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Request Date
                                </p>
                                <p className="text-base text-gray-900 dark:text-white">
                                  {log.request_date && new Date(log.request_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Requested Items */}
                          {log.requested_items && log.requested_items.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                              <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Requested Items
                              </h6>
                              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {log.requested_items.map((item, index) => (
                                  <div key={index} className="py-3 first:pt-0 last:pb-0">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-base font-medium text-gray-900 dark:text-white">
                                          {item.product_name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                          Quantity: {item.quantity} {item.unit}
                                        </p>
                                      </div>
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        item.status?.toLowerCase() === 'approved' 
                                          ? 'bg-green-100 text-green-800'
                                          : item.status?.toLowerCase() === 'rejected'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {item.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Approval Information */}
                          {(log.approver_name || log.rejected_reason) && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                              <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                {log.request_status === 'REJECTED' ? 'Rejection Details' : 'Approval Details'}
                              </h6>
                              <div className="space-y-3">
                                {log.approver_name && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                      {log.request_status === 'REJECTED' ? 'Rejected by' : 'Approved by'}
                                    </p>
                                    <p className="text-base text-gray-900 dark:text-white">
                                      {log.approver_name}
                                    </p>
                                    {log.approval_date && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        on {new Date(log.approval_date).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {log.rejected_reason && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                      Reason for Rejection
                                    </p>
                                    <p className="text-base text-red-600 dark:text-red-400">
                                      {log.rejected_reason}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Changes Comparison */}
                      {(log.old_values || log.new_values) && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Changes Made
                          </h5>
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                            {Object.keys({ ...log.old_values, ...log.new_values }).map((key) => (
                              <div key={key} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Previous Value</span>
                                    <div className="text-sm text-red-600 dark:text-red-400">
                                      {log.old_values?.[key] !== undefined ? String(log.old_values[key]) : '—'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">New Value</span>
                                    <div className="text-sm text-green-600 dark:text-green-400">
                                      {log.new_values?.[key] !== undefined ? String(log.new_values[key]) : '—'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            {log.notes && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Notes
                </h3>
                <p className="text-gray-700 dark:text-gray-300">{log.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDetailView;
