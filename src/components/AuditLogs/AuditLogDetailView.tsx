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
  user_name?: string;
  user_email?: string;
  user_status?: string;
  role_name?: string;
  branch_location?: string;
  branch_address?: string;
  action_category?: string;
  severity_level?: string;
  seconds_ago?: number;
  time_period?: string;
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

  const renderJsonData = (data: any, title: string) => {
    if (!data) return null;

    return (
      <div className="space-y-2">
        <button
          onClick={() =>
            toggleSection(
              title
                .toLowerCase()
                .replace(" ", "") as keyof typeof expandedSections
            )
          }
          className="flex items-center justify-between w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium text-gray-700">{title}</span>
          {expandedSections[
            title
              .toLowerCase()
              .replace(" ", "") as keyof typeof expandedSections
          ] ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {expandedSections[
          title.toLowerCase().replace(" ", "") as keyof typeof expandedSections
        ] && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {log.user_name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {log.user_email || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Role
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {log.role_name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Branch
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {log.branch_location || "Unknown"}
                  </p>
                </div>
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
                <div className="mt-4 space-y-4">
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

            {/* Data Changes */}
            <div className="space-y-4">
              {renderJsonData(log.metadata, "Metadata")}
              {renderJsonData(log.old_values, "Old Values")}
              {renderJsonData(log.new_values, "New Values")}
            </div>
          </div>
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
  );
};

export default AuditLogDetailView;
