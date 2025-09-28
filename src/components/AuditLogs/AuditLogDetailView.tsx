import React, { useState } from "react";
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
  Hash,
  Building,
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
  user_id: string; // UUID of the user who performed the action
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

interface AuditLogDetailViewProps {
  log: AuditLogDetail;
  onClose: () => void;
}

const AuditLogDetailView: React.FC<AuditLogDetailViewProps> = ({
  log,
  onClose,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    metadata: false,
    oldValues: false,
    newValues: false,
    technical: false,
    changes: false,
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

  const getActionColor = (action: string) => {
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
  };

  const getActionIcon = (action: string) => {
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
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden
        
        dark:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(40,40,40,0.6)]"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700
          bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950"
        >
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
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors
              shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.7)]
              dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]"
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
                  <span
                    className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-xl 
                    shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] 
                    dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.05)] 
                    backdrop-blur-sm ${getActionColor(log.action)}`}
                  >
                    <div className="flex items-center">
                      {getActionIcon(log.action)}
                      <span className="ml-2">
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </div>
                  </span>

                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                      log.severity_level || "medium"
                    )}`}
                  >
                    {log.severity_level || "Medium"} Severity
                  </div>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div
              className="rounded-2xl bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
              shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.7)]
              dark:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(40,40,40,0.6)]
              transition-all duration-300 p-6"
            >
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
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4
                    shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]
                    dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5),inset_-4px_-4px_8px_rgba(60,60,60,0.2)]"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Full Name
                      </p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {log.user_name || log.user?.name}
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
                        {log.user_email || log.user?.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Role Information
                      </p>
                      <p className="text-gray-900 dark:text-white capitalize">
                        {log.role_name || log.user?.role?.role_name}
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
                      <div
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${
                          log.user_status?.toLowerCase() === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
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
                  <div
                    className="grid grid-cols-1 gap-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4
                    shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]
                    dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5),inset_-4px_-4px_8px_rgba(60,60,60,0.2)]"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Branch Information
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {log.branch_location || log.user?.branch?.location}
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
              </div>
            </div>

            {/* Request Information */}
            {log.entity_type === "product_requisition" && (
              <div
                className="rounded-2xl bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
                shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.7)]
                dark:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(40,40,40,0.6)]
                transition-all duration-300 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Request Information
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Request ID:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 flex items-center">
                      <Hash className="w-4 h-4 mr-1" />
                      {log.request_id || log.entity_id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Status:
                    </span>
                    <span
                      className={`px-2 py-1 rounded-lg text-sm font-medium ${
                        log.request_status?.toLowerCase() === "approved"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : log.request_status?.toLowerCase() === "rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {log.request_status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Requester:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {log.requester_name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Role:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {log.requester_role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Branch:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 flex items-center">
                      <Building className="w-4 h-4 mr-1" />
                      {log.requester_branch}
                    </span>
                  </div>

                  {log.request_date && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Request Date:
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {new Date(log.request_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {log.approver_name && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Approved By:
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {log.approver_name}
                      </span>
                    </div>
                  )}

                  {log.approval_date && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Approval Date:
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {new Date(log.approval_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {log.rejected_reason && (
                    <div className="flex items-start justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Rejection Reason:
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 max-w-xs text-right">
                        {log.rejected_reason}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Requested Items */}
            {log.requested_items && log.requested_items.length > 0 && (
              <div
                className="rounded-2xl bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
                shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.7)]
                dark:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(40,40,40,0.6)]
                transition-all duration-300 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Requested Items
                </h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {log.requested_items.map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {item.product_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                item.status?.toLowerCase() === "approved"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : item.status?.toLowerCase() === "rejected"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Technical Information */}
            <div
              className="rounded-2xl bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950
              shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.7)]
              dark:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(40,40,40,0.6)]
              transition-all duration-300 p-6"
            >
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

                  {/* Changes Comparison */}
                  {(log.old_values || log.new_values) && (
                    <div>
                      <button
                        onClick={() => toggleSection("changes")}
                        className="w-full flex justify-between items-center text-md font-medium text-gray-700 dark:text-gray-300 mb-3"
                      >
                        <span>Changes Made</span>
                        {expandedSections.changes ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {expandedSections.changes && (
                        <div
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-3
                          shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05),inset_-4px_-4px_8px_rgba(255,255,255,0.5)]
                          dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5),inset_-4px_-4px_8px_rgba(60,60,60,0.2)]"
                        >
                          {Object.keys({
                            ...log.old_values,
                            ...log.new_values,
                          }).map((key) => (
                            <div
                              key={key}
                              className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {key
                                  .split("_")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Previous Value
                                  </span>
                                  <div className="text-sm text-red-600 dark:text-red-400">
                                    {log.old_values?.[key] !== undefined
                                      ? String(log.old_values[key])
                                      : "—"}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    New Value
                                  </span>
                                  <div className="text-sm text-green-600 dark:text-green-400">
                                    {log.new_values?.[key] !== undefined
                                      ? String(log.new_values[key])
                                      : "—"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
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
              className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors
                shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)]
                dark:shadow-[6px_6px_12px_rgba(0,0,0,0.6),-6px_-6px_12px_rgba(255,255,255,0.05)]
                hover:scale-[1.02] active:scale-[0.98]"
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
