import { Download } from "lucide-react";

type AuditLog = {
  id: number;
  action: string;
  user: string;
  date: string;
  details: string;
};

const initialLogs: AuditLog[] = [
  {
    id: 1,
    action: "Created Lighting Fixture",
    user: "alice.wong",
    date: "2024-06-10 09:15",
    details: "Added new fixture: LED Panel 600x600mm",
  },
  {
    id: 2,
    action: "Updated Inventory",
    user: "bob.jones",
    date: "2024-06-10 10:22",
    details: "Changed quantity for LED Bulb 9W from 120 to 150",
  },
  {
    id: 3,
    action: "Deleted Supplier",
    user: "carol.smith",
    date: "2024-06-10 11:00",
    details: "Removed supplier: BrightLight Co.",
  },
  {
    id: 4,
    action: "Viewed Order",
    user: "alice.wong",
    date: "2024-06-10 11:30",
    details: "Checked order #1023 for status update",
  },
  {
    id: 5,
    action: "Edited Fixture Details",
    user: "bob.jones",
    date: "2024-06-10 12:05",
    details: "Updated wattage for LED Panel 600x600mm",
  },
];

function getSeverityIcon() {
  return (
    <span className="inline-block w-4 h-4 bg-yellow-400 rounded-full mr-2" />
  );
}
function getSeverityColor() {
  return "border-yellow-400 text-yellow-700";
}

export default function UserAuditLogsDetailView() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Activity</h2>
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded shadow"
              title="Export to Excel"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Action
                  </th>

                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Details
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                    Severity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {initialLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-2 flex items-center">
                      {getSeverityIcon()}
                      <span className="font-medium">{log.action}</span>
                    </td>
                    <td className="px-4 py-2">
                      {log.date}
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        2024-06-10 09:15
                      </span>
                    </td>
                    <td className="px-4 py-2">{log.details}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor()}`}
                      >
                        Medium
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700"></div>
      </div>
    </div>
  );
}
