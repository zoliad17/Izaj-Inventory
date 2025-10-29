import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSidebar } from "./SidebarContext";
import {
  LogOutIcon,
  MenuIcon,
  Home,
  MapPin,
  // Package,
  ClipboardList,
  ArrowRightLeft,
  Users,
  Building2,
  Activity,
  Moon,
  Sun,
  // ShoppingCart,
  Warehouse,
  Book,
  Coins,
  Rotate3D,
  Building2Icon,
} from "lucide-react";
import { useAuth, useRole } from "../../contexts/AuthContext";

// theme
import { useTheme } from "../ThemeContext/ThemeContext";
import { API_BASE_URL } from "../../config/config";

// Import the new hook for branch request counts
import { useBranchRequestCounts } from "../../hooks/useBranchRequestCounts";

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

function Sidebar() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { hasRole } = useRole();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  const { isDarkMode, toggleTheme } = useTheme();

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
    totalCount: branchRequestCount,
    pendingCount,
    transferredCount,
    requestedCount,
  } = useBranchRequestCounts({
    userId: user?.user_id,
    branchId: user?.branch_id ? user.branch_id : undefined,
    refreshInterval: 300000, // Refresh every 5 minutes
    enabled: hasRole(["Admin", "Branch Manager"]),
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
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
        {
          icon: Rotate3D,
          label: "Transferred",
          path: "/transferred",
          allowedRoles: ["Admin", "Branch Manager"],
        },
        {
          icon: ArrowRightLeft,
          label: "Requested Item",
          path: "/requested_item",
          allowedRoles: ["Admin", "Branch Manager"],
        },
      ],
    },
    {
      icon: Coins,
      label: "Sales",
      path: "/sales",
      allowedRoles: ["Admin", "Branch Manager", "Super Admin"],
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
      icon: Book,
      label: "Audit Logs",
      path: "/auditlogs",
      allowedRoles: ["Super Admin"],
    },
    {
      icon: Activity,
      label: "My Activity",
      path: "/my-activity",
      allowedRoles: ["Admin", "Branch Manager", "Super Admin"],
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
                  src="/dist/assets/image/logo.jpg"
                  alt="Logo"
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div className="ml-3">
                <div className="text-xl font-bold ">IZAJ-LIGHTING</div>
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
                  src="/dist/assets/image/logo.jpg"
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
                    className={`group flex items-center font-medium hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:shadow-md hover:scale-[1.02] rounded-lg transition-all duration-300 ease-in-out ${
                      isCollapsed ? "p-3 justify-center" : "p-3"
                    }`}
                    title={item.label}
                  >
                    <item.icon className="h-6 w-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                    {!isCollapsed && (
                      <span className="ml-3 whitespace-nowrap group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {item.label}
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
                            branchRequestCount > 0 && (
                              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)]">
                                {branchRequestCount}
                              </span>
                            )}
                        </div>
                        {!isCollapsed && (
                          <span className="ml-3 flex-grow text-left whitespace-nowrap group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 flex items-center">
                            <span className="truncate">{item.label}</span>
                            {/* Notification badge for Branch Request - positioned beside the nav text */}
                            {item.label === "Branch Request" &&
                              branchRequestCount > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)] flex-shrink-0">
                                  {branchRequestCount}
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
                                  className="group flex items-center px-3 py-2 text-sm font-medium hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:shadow-sm hover:scale-[1.01] rounded-lg transition-all duration-300 ease-in-out relative"
                                >
                                  <div className="relative flex items-center">
                                    <subItem.icon className="h-5 w-5 mr-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                                    {/* For collapsed state, show badge overlaid on top-right of icon */}
                                    {isCollapsed &&
                                      item.label === "Branch Request" && (
                                        <>
                                          {subItem.label ===
                                            "Pending Request" &&
                                            pendingCount > 0 && (
                                              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)]">
                                                {pendingCount}
                                              </span>
                                            )}
                                          {subItem.label === "Transferred" &&
                                            transferredCount > 0 && (
                                              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)]">
                                                {transferredCount}
                                              </span>
                                            )}
                                          {subItem.label === "Requested Item" &&
                                            requestedCount > 0 && (
                                              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)]">
                                                {requestedCount}
                                              </span>
                                            )}
                                        </>
                                      )}
                                  </div>
                                  {!isCollapsed && (
                                    <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 flex items-center">
                                      {subItem.label}
                                      {/* Individual count badges for Branch Request sub-items - positioned beside the nav text */}
                                      {item.label === "Branch Request" && (
                                        <>
                                          {subItem.label ===
                                            "Pending Request" &&
                                            pendingCount > 0 && (
                                              <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)] flex-shrink-0">
                                                {pendingCount}
                                              </span>
                                            )}
                                          {subItem.label === "Transferred" &&
                                            transferredCount > 0 && (
                                              <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)] flex-shrink-0">
                                                {transferredCount}
                                              </span>
                                            )}
                                          {subItem.label === "Requested Item" &&
                                            requestedCount > 0 && (
                                              <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),_inset_-2px_-2px_4px_rgba(255,255,255,0.1)] flex-shrink-0">
                                                {requestedCount}
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
                        User
                      </p>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span className="font-bold text-base">Active</span>
                    </div>
                    <div className="flex items-center text-base text-gray-600 dark:text-gray-400">
                      <MapPin className="w-3 h-3 mr-2 text-gray-400 dark:text-gray-500" />
                      <span className="truncate">
                        {userBranch?.location || "Unknown Branch"}
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
