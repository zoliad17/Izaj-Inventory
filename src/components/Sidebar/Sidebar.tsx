import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "./SidebarContext";
import logo from "@/assets/image/logo.jpg";
import {
  LogOutIcon,
  MenuIcon,
  Home,
  MapPin,
  Package,
  ClipboardList,
  ArrowRightLeft,
  Users,
  Building2,
  Moon,
  Sun,
  Clock,
  // ShoppingCart,
  Warehouse,
  Book,
  // Coins,
  // Rotate3D,
  Building2Icon,
  BarChart3,
} from "lucide-react";
import { useAuth, useRole } from "../../contexts/AuthContext";

// theme
import { useTheme } from "../ThemeContext/ThemeContext";
import { API_BASE_URL } from "../../config/config";

// Import the new hook for branch request counts
import { useBranchRequestCounts } from "../../hooks/useBranchRequestCounts";
// Import notifications hook to show global unread badge in the sidebar
import useNotifications from "../../hooks/useNotifications";

// Define types for the navigation items
interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string | null;
  subItems?: SubItem[];
  allowedRoles?: string[];
}

interface SubItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  allowedRoles?: string[];
}

// User type is imported from AuthContext

interface Branch {
  id: number;
  location: string;
}

const ROLE_LABELS: Record<number, string> = {
  1: "Super Admin",
  2: "Branch Manager",
  3: "Admin",
};

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { hasRole } = useRole();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { isDarkMode, toggleTheme } = useTheme();

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Branches will be fetched via API

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/branches`);
        if (!response.ok) {
          throw new Error("Failed to fetch branches");
        }
        const data = await response.json();
        setBranches(data || []);
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };

    fetchBranches();
  }, []);

  // Define type for user branch
  const [branches, setBranches] = useState<Branch[]>([]);

  const { logout } = useAuth();

  // Use the branch request counts hook
  const {
    // totalCount (branchRequestCount) is intentionally not used for the parent badge
    // because we compute the displayed badge from individual sub-item counts
    pendingCount,
    transferredCount,
    requestedCount,
    refetch,
  } = useBranchRequestCounts({
    userId: user?.user_id,
    branchId: user?.branch_id ? user.branch_id : undefined,
    refreshInterval: 300000, // Refresh every 5 minutes
    enabled: hasRole(["Admin", "Branch Manager"]),
  });

  // Global notifications unread count (used for sidebar badge)
  const { unreadCount: notificationsUnread } = useNotifications({
    pollInterval: 30000,
    realtime: true,
    userId: user?.user_id || null,
  });

  // Local flag to clear the transferred badge when the user opens the Transferred tab
  const [clearedTransferred, setClearedTransferred] = useState(false);
  const prevTransferredRef = useRef<number>(transferredCount);
  const [unreadTransferredCount, setUnreadTransferredCount] =
    useState<number>(0);
  // Local flags to clear pending/requested badges when the user opens those tabs
  const [clearedPending, setClearedPending] = useState(false);
  const prevPendingRef = useRef<number>(pendingCount);

  const [clearedRequested, setClearedRequested] = useState(false);
  const prevRequestedRef = useRef<number>(requestedCount);
  const [unreadRequestedCount, setUnreadRequestedCount] = useState<number>(0);

  // Compute the parent Branch Request badge count based on individual sub-item counts
  // and cleared flags. This lets the parent badge hide immediately when sub-items
  // have been locally cleared by navigation actions.
  const displayedBranchBadge =
    (clearedPending ? 0 : pendingCount) +
    (clearedTransferred ? 0 : unreadTransferredCount) +
    (clearedRequested ? 0 : unreadRequestedCount);

  const fetchUnreadTransferred = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/notifications/unread/${
          user.user_id
        }?link=/transferred&user_id=${encodeURIComponent(user.user_id)}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        throw new Error("Failed to fetch unread transferred notifications");
      }
      const json = await res.json();
      setUnreadTransferredCount(json.count || 0);
    } catch (err) {
      console.error("Error fetching unread transferred notifications:", err);
    }
  }, [user?.user_id]);

  const fetchUnreadRequested = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/notifications/unread/${
          user.user_id
        }?link=/requested_item&user_id=${encodeURIComponent(user.user_id)}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        throw new Error("Failed to fetch unread requested notifications");
      }
      const json = await res.json();
      setUnreadRequestedCount(json.count || 0);
    } catch (err) {
      console.error("Error fetching unread requested notifications:", err);
    }
  }, [user?.user_id]);

  // Reset the cleared flag when the transferredCount or unreadTransferredCount changes (new items arrive or notifications change)
  useEffect(() => {
    if (transferredCount !== prevTransferredRef.current) {
      setClearedTransferred(false);
      prevTransferredRef.current = transferredCount;
    }
  }, [transferredCount, unreadTransferredCount]);

  // Reset cleared flags when pending/requested counts change
  useEffect(() => {
    if (pendingCount !== prevPendingRef.current) {
      setClearedPending(false);
      prevPendingRef.current = pendingCount;
    }
  }, [pendingCount]);

  useEffect(() => {
    if (unreadRequestedCount !== prevRequestedRef.current) {
      setClearedRequested(false);
      prevRequestedRef.current = unreadRequestedCount;
    }
  }, [unreadRequestedCount]);

  // Fetch unread transferred and requested notifications on mount and when user changes
  useEffect(() => {
    fetchUnreadTransferred();
    fetchUnreadRequested();

    // Set up periodic refresh for unread counts (every 30 seconds)
    const interval = setInterval(() => {
      fetchUnreadTransferred();
      fetchUnreadRequested();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadTransferred, fetchUnreadRequested]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Helper to mark notifications for a particular link as read
  const markNotificationsReadByLink = async (link: string) => {
    if (!user?.user_id) return;
    try {
      await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ link, user_id: user.user_id }),
      });
    } catch (err) {
      console.error(`Failed to mark notifications for ${link} as read`, err);
    }
  };

  // Navigation items data with proper typing and role permissions
  const navItems: NavItem[] = [
    {
      icon: Home,
      label: "Dashboard",
      path: "/dashboard",
      allowedRoles: ["Admin", "Branch Manager", "Super Admin"],
    },

    {
      icon: MapPin,
      label: "Branch",
      path: "/branch_location",
      allowedRoles: ["Admin", "Branch Manager"],
    },

    {
      icon: Building2Icon,
      label: "Branch Request",
      path: null,
      allowedRoles: ["Admin", "Branch Manager"],
      subItems: [
        {
          icon: ClipboardList,
          label: "Pending Request",
          path: "/pending_request",
          allowedRoles: ["Branch Manager"],
        },
        // {
        //   icon: Rotate3D,
        //   label: "Transferred",
        //   path: "/transferred",
        //   allowedRoles: ["Admin", "Branch Manager"],
        // },
        {
          icon: ArrowRightLeft,
          label: "Requested Item",
          path: "/requested_item",
          allowedRoles: ["Admin", "Branch Manager"],
        },
      ],
    },
    // {
    //   icon: Coins,
    //   label: "Sales",
    //   path: "/sales",
    //   allowedRoles: ["Admin", "Branch Manager", "Super Admin"],
    // },
    {
      icon: BarChart3,
      label: "Analytics",
      path: "/analytics",
      allowedRoles: ["Admin", "Branch Manager"],
    },
    {
      icon: Warehouse,
      label: "Stock",
      path: "/all_stock",
      allowedRoles: ["Admin", "Branch Manager"],
    },
    // {
    //   icon: CogIcon,
    //   label: "Setting",
    //   path: "#",
    //   allowedRoles: [ "Super Admin"],
    // },
    {
      icon: Users,
      label: "User",
      path: "/user-management",
      allowedRoles: ["Super Admin"],
    },
    {
      icon: Building2,
      label: "Branches",
      path: "/branch-management",
      allowedRoles: ["Super Admin"],
    },
    {
      icon: Package,
      label: "Centralized Products",
      path: "/centralized-products",
      allowedRoles: ["Super Admin"],
    },
    {
      icon: Book,
      label: "Audit Logs",
      path: "/auditlogs",
      allowedRoles: ["Super Admin"],
    },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter((item) => {
    // If no allowedRoles specified, show to all
    if (!item.allowedRoles) return true;
    // Check if user has required role
    return hasRole(item.allowedRoles);
  });

  // Filter subItems based on user role
  const navItemsWithFilteredSubItems = filteredNavItems
    .map((item) => {
      if (!item.subItems) return item;

      const filteredSubItems = item.subItems.filter((subItem) => {
        // If no allowedRoles specified, show to all
        if (!subItem.allowedRoles) return true;
        // Check if user has required role
        return hasRole(subItem.allowedRoles);
      });

      // Only keep the parent item if it has subItems (if it's a dropdown)
      if (filteredSubItems.length === 0 && item.path === null) return null;

      return {
        ...item,
        subItems: filteredSubItems.length > 0 ? filteredSubItems : undefined,
      };
    })
    .filter(Boolean) as NavItem[];

  const userRoleLabel = user.role_name || ROLE_LABELS[user.role_id] || "User";
  // Find the user's branch based on branch_id
  const userBranch = branches.find((branch) => branch.id === user?.branch_id);

  return (
    <div
      className={`h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 fixed top-0 left-0 overflow-y-auto flex flex-col justify-between border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-25" : "w-64"
      }`}
    >
      {/* Header Section */}
      <div>
        <div className="flex items-center p-4 justify-between border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed ? (
            <div
              className="flex items-center"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              {isLogoHovered ? (
                <button
                  onClick={toggleSidebar}
                  className="text-gray-500 cursor-pointer hover:text-gray-700 p-1 rounded-md transition-colors duration-200"
                  aria-label="Collapse sidebar"
                >
                  <MenuIcon className="h-6 w-6" />
                </button>
              ) : (
                <img
                  src={logo}
                  alt="Logo"
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div className="ml-3 flex flex-col">
                <div className="text-xl font-bold mb-1">
                  {userBranch?.location || "IZAJ-LIGHTING"}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-gray-600 dark:text-gray-300" />
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-0.5 rounded-full">
                    Branch Location
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="w-full flex justify-center"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              {isLogoHovered ? (
                <button
                  onClick={toggleSidebar}
                  className="text-gray-500 cursor-pointer hover:text-gray-700 p-1 rounded-md transition-colors duration-200"
                  aria-label="Expand sidebar"
                >
                  <MenuIcon className="h-6 w-6" />
                </button>
              ) : (
                <img
                  src={logo}
                  alt="Logo"
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
            </div>
          )}
        </div>

        {/* Search Bar (only shown when expanded)
        {!isCollapsed && (
          <div className="px-3 py-4 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )} */}

        {/* Navigation Section */}
        <nav className="px-2 py-4">
          <ul className="space-y-1">
            {navItemsWithFilteredSubItems.map((item, index) => (
              <li key={index}>
                {item.path ? (
                  // Regular navigation item
                  <Link
                    to={item.path}
                    className={`group flex items-center font-medium rounded-lg transition-all duration-300 ease-in-out ${
                      location.pathname === item.path
                        ? "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 shadow-md scale-[1.02] text-blue-700 dark:text-blue-300"
                        : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:shadow-md hover:scale-[1.02] text-gray-700 dark:text-gray-300"
                    } ${isCollapsed ? "p-3 justify-center" : "p-3"}`}
                    title={item.label}
                    onClick={async () => {
                      // Handle special case for Stock link - clear the transferred badge
                      if (item.label === "Stock") {
                        try {
                          // Mark transferred notifications as read
                          await fetch(
                            `${API_BASE_URL}/api/notifications/mark-read`,
                            {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              credentials: "include",
                              body: JSON.stringify({
                                link: "/transferred",
                                user_id: user?.user_id,
                              }),
                            }
                          );
                          // Clear local badge until counts change
                          setClearedTransferred(true);
                          // Also clear the unread transferred count locally
                          setUnreadTransferredCount(0);
                        } catch (err) {
                          console.error(
                            "Failed to mark transferred notifications read on navigation",
                            err
                          );
                        }
                        // Trigger a refresh of counts if available
                        try {
                          refetch && refetch();
                        } catch (e) {
                          /* ignore */
                        }
                      }
                    }}
                  >
                    <item.icon
                      className={`h-6 w-6 transition-colors duration-300 ${
                        location.pathname === item.path
                          ? "text-blue-600 dark:text-blue-400"
                          : "group-hover:text-blue-600 dark:group-hover:text-blue-400"
                      }`}
                    />
                    {isCollapsed &&
                      item.label === "Notifications" &&
                      notificationsUnread > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {notificationsUnread}
                        </span>
                      )}
                    {!isCollapsed && (
                      <span className="ml-3 whitespace-nowrap transition-colors duration-300 flex items-center">
                        <span
                          className={
                            location.pathname === item.path ? "font-bold" : ""
                          }
                        >
                          {item.label}
                        </span>
                        {item.label === "Notifications" &&
                          notificationsUnread > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                              {notificationsUnread}
                            </span>
                          )}
                        {item.label === "Stock" &&
                          (clearedTransferred ? 0 : unreadTransferredCount) >
                            0 && (
                            <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)] flex-shrink-0">
                              {clearedTransferred ? 0 : unreadTransferredCount}
                            </span>
                          )}
                      </span>
                    )}
                  </Link>
                ) : (
                  // Dropdown navigation item (only if has subItems)
                  item.subItems &&
                  item.subItems.length > 0 && (
                    <>
                      <button
                        onClick={toggleDropdown}
                        className={`group flex items-center cursor-pointer w-full font-medium hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:shadow-md hover:scale-[1.02] rounded-lg transition-all duration-300 ease-in-out relative ${
                          isCollapsed ? "p-3 justify-center" : "p-3"
                        }`}
                        title={item.label}
                        disabled={isCollapsed}
                      >
                        <div className="relative flex items-center">
                          <item.icon className="h-6 w-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                          {/* For collapsed state, show badge overlaid on top-right of icon */}
                          {isCollapsed &&
                            item.label === "Branch Request" &&
                            displayedBranchBadge > 0 && (
                              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)]">
                                {displayedBranchBadge}
                              </span>
                            )}
                        </div>
                        {!isCollapsed && (
                          <span className="ml-3 flex-grow text-left whitespace-nowrap group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 flex items-center">
                            <span className="truncate">{item.label}</span>
                            {/* Notification badge for Branch Request - positioned beside the nav text */}
                            {item.label === "Branch Request" &&
                              displayedBranchBadge > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)] flex-shrink-0">
                                  {displayedBranchBadge}
                                </span>
                              )}
                          </span>
                        )}
                        {!isCollapsed && (
                          <svg
                            className={`ml-2 w-4 h-4 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 ${
                              isDropdownOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Dropdown content */}
                      {item.subItems && (
                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            isDropdownOpen ? "max-h-40" : "max-h-0"
                          }`}
                        >
                          <ul className="ml-2 pl-6 border-l-2 border-blue-200 dark:border-blue-700">
                            {item.subItems.map((subItem, subIndex) => (
                              <li key={subIndex} className="relative">
                                <Link
                                  to={subItem.path}
                                  onClick={async () => {
                                    try {
                                      if (subItem.path === "/transferred") {
                                        await fetch(
                                          `${API_BASE_URL}/api/notifications/mark-read`,
                                          {
                                            method: "PUT",
                                            headers: {
                                              "Content-Type":
                                                "application/json",
                                            },
                                            credentials: "include",
                                            body: JSON.stringify({
                                              link: "/transferred",
                                              user_id: user?.user_id,
                                            }),
                                          }
                                        );
                                        // Clear local badge until counts change
                                        setClearedTransferred(true);
                                        // Also clear the unread transferred count locally
                                        setUnreadTransferredCount(0);
                                      } else if (
                                        subItem.path === "/pending_request"
                                      ) {
                                        await markNotificationsReadByLink(
                                          "/pending_request"
                                        );
                                        setClearedPending(true);
                                      } else if (
                                        subItem.path === "/requested_item"
                                      ) {
                                        await markNotificationsReadByLink(
                                          "/requested_item"
                                        );
                                        setClearedRequested(true);
                                        // Clear the unread requested count locally
                                        setUnreadRequestedCount(0);
                                        // Refresh the count
                                        fetchUnreadRequested();
                                      }
                                    } catch (err) {
                                      console.error(
                                        "Failed to mark notifications read on navigation",
                                        err
                                      );
                                    }
                                    // Trigger a refresh of counts if available
                                    try {
                                      refetch && refetch();
                                    } catch (e) {
                                      /* ignore */
                                    }
                                  }}
                                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out relative ${
                                    location.pathname === subItem.path
                                      ? "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 shadow-sm scale-[1.01] text-blue-700 dark:text-blue-300"
                                      : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:shadow-sm hover:scale-[1.01] text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  <div className="relative flex items-center">
                                    <subItem.icon
                                      className={`h-5 w-5 mr-3 transition-colors duration-300 ${
                                        location.pathname === subItem.path
                                          ? "text-blue-600 dark:text-blue-400"
                                          : "group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                      }`}
                                    />
                                    {/* For collapsed state, show badge overlaid on top-right of icon */}
                                    {isCollapsed &&
                                      item.label === "Branch Request" && (
                                        <>
                                          {subItem.label ===
                                            "Pending Request" &&
                                            (clearedPending
                                              ? 0
                                              : pendingCount) > 0 && (
                                              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)]">
                                                {clearedPending
                                                  ? 0
                                                  : pendingCount}
                                              </span>
                                            )}
                                          {subItem.label === "Requested Item" &&
                                            (clearedRequested
                                              ? 0
                                              : unreadRequestedCount) > 0 && (
                                              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)]">
                                                {clearedRequested
                                                  ? 0
                                                  : unreadRequestedCount}
                                              </span>
                                            )}
                                        </>
                                      )}
                                  </div>
                                  {!isCollapsed && (
                                    <span
                                      className={`transition-colors duration-300 flex items-center ${
                                        location.pathname === subItem.path
                                          ? "text-blue-600 dark:text-blue-400 font-bold"
                                          : "group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                      }`}
                                    >
                                      {subItem.label}
                                      {/* Individual count badges for Branch Request sub-items - positioned beside the nav text */}
                                      {item.label === "Branch Request" && (
                                        <>
                                          {subItem.label ===
                                            "Pending Request" &&
                                            (clearedPending
                                              ? 0
                                              : pendingCount) > 0 && (
                                              <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)] flex-shrink-0">
                                                {clearedPending
                                                  ? 0
                                                  : pendingCount}
                                              </span>
                                            )}
                                          {subItem.label === "Requested Item" &&
                                            (clearedRequested
                                              ? 0
                                              : unreadRequestedCount) > 0 && (
                                              <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)] flex-shrink-0">
                                                {clearedRequested
                                                  ? 0
                                                  : unreadRequestedCount}
                                              </span>
                                            )}
                                        </>
                                      )}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col space-y-3">
          {user && (
            <>
              {!isCollapsed ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4 border border-blue-100 dark:border-blue-800/50 hover:shadow-lg hover:scale-[1.02] hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 transition-all duration-300 ease-in-out">
                  {/* User Avatar */}
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-base">
                      {(user.name || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                        {user.name || user.email}
                      </h4>
                      <p className="text-base text-gray-600 dark:text-gray-400 truncate">
                        {userRoleLabel}
                      </p>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span className="font-bold text-base">
                        {user.status || "Active"}
                      </span>
                    </div>
                    {/* <div className="flex items-center text-base text-gray-600 dark:text-gray-400">
                      <MapPin className="w-3 h-3 mr-2 text-gray-400 dark:text-gray-500" />
                      <span className="truncate">
                        {userBranch?.location || "Unknown Branch"}
                      </span>
                    </div> */}
                    <div className="flex items-center text-base text-gray-600 dark:text-gray-400 mt-1">
                      <Clock className="w-3 h-3 mr-2 text-gray-400 dark:text-gray-500" />
                      <span className="truncate">
                        {currentTime.toLocaleDateString()}{" "}
                        {currentTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={toggleTheme}
            className={`group flex items-center justify-center font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 dark:hover:from-yellow-900/20 dark:hover:to-orange-900/20 hover:shadow-md hover:scale-[1.02] rounded-lg transition-all duration-300 ease-in-out ${
              isCollapsed ? "p-3" : "px-3 py-2.5"
            }`}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isCollapsed ? (
              isDarkMode ? (
                <Sun className="h-6 w-6 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300" />
              ) : (
                <Moon className="h-6 w-6 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300" />
              )
            ) : (
              <>
                {isDarkMode ? (
                  <>
                    <Sun className="h-5 w-5 mr-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300" />
                    <span className="group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">
                      Light Mode
                    </span>
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5 mr-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300" />
                    <span className="group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">
                      Dark Mode
                    </span>
                  </>
                )}
              </>
            )}
          </button>

          {/* Static notification button with indicator */}
          {/* <button
            className={`group flex items-center justify-center font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:shadow-md hover:scale-[1.02] rounded-lg transition-all duration-300 ease-in-out relative ${
              isCollapsed ? "p-3" : "px-3 py-2.5"
            }`}
            title="Notifications"
          >
            {isCollapsed ? (
              <>
                <Activity className="h-6 w-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  5
                </span>
              </>
            ) : (
              <>
                <Activity className="h-5 w-5 mr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  Updates
                </span>
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  5
                </span>
              </>
            )}
          </button> */}

          <button
            onClick={handleLogout}
            className={`group flex items-center justify-center font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:scale-[1.02] rounded-lg transition-all duration-300 ease-in-out ${
              isCollapsed ? "p-3" : "px-3 py-2.5"
            }`}
            title="Logout"
          >
            {isCollapsed ? (
              <LogOutIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <span className="group-hover:tracking-wide transition-all duration-300">
                Logout
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
