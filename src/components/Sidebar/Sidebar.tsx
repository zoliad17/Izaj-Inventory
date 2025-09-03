import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  LocationMarkerIcon,
  CubeIcon,
  ClipboardListIcon,
  SwitchHorizontalIcon,
  // CogIcon,
  UserCircleIcon,
  // SearchIcon,
} from "@heroicons/react/outline";
import { useSidebar } from "./SidebarContext";
import { LogOutIcon, MenuIcon } from "lucide-react";
import { supabase } from "../../../backend/Server/Supabase/supabase";

// theme
import { useTheme } from "../ThemeContext/ThemeContext";
import { MoonIcon, SunIcon } from "@heroicons/react/outline";

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

// Define type for the user object
interface User {
  email?: string;
  username?: string;
  name?: string;
  role?: { role_name: string };
  branch_id?: number;
}

interface Branch {
  id: number;
  location: string;
}

function Sidebar() {
  const navigate = useNavigate();
  const userString = localStorage.getItem("user");
  const user: User | null = userString ? JSON.parse(userString) : null;
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  const { isDarkMode, toggleTheme } = useTheme();

  const userRole = user?.role?.role_name || localStorage.getItem("userRole");

  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase
        .from("branch")
        .select("id, location");
      if (error) {
        console.error("Error fetching branches:", error);
      } else {
        setBranches(data);
      }
    };

    fetchBranches();
  }, []);

  // Define type for user branch
  const [branches, setBranches] = useState<Branch[]>([]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Navigation items data with proper typing and role permissions
  const navItems: NavItem[] = [
    {
      icon: HomeIcon,
      label: "Dashboard",
      path: "/dashboard",
      allowedRoles: ["Admin", "Branch Manager", "Super Admin"],
    },
    {
      icon: LocationMarkerIcon,
      label: "Branch",
      path: "/branch_location",
      allowedRoles: ["Admin", "Branch Manager"],
    },

    {
      icon: ClipboardListIcon,
      label: "Branch Request",
      path: null,
      allowedRoles: ["Admin", "Branch Manager"],
      subItems: [
        {
          icon: ClipboardListIcon,
          label: "Pending Request",
          path: "/pending_request",
          allowedRoles: ["Branch Manager"],
        },
        {
          icon: SwitchHorizontalIcon,
          label: "Transferred",
          path: "/transferred",
          allowedRoles: ["Admin", "Branch Manager"],
        },
        {
          icon: SwitchHorizontalIcon,
          label: "Requested Item",
          path: "/requested_item",
          allowedRoles: ["Admin", "Branch Manager"],
        },
      ],
    },
    {
      icon: CubeIcon,
      label: "Sales",
      path: "/sales",
      allowedRoles: ["Admin", "Branch Manager", "Super Admin"],
    },
    {
      icon: CubeIcon,
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
      icon: UserCircleIcon,
      label: "User",
      path: "/user-management",
      allowedRoles: ["Super Admin"],
    },
    {
      icon: UserCircleIcon,
      label: "AuditLogs",
      path: "/auditlogs",
      allowedRoles: ["Super Admin"],
    },
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter((item) => {
    // If no allowedRoles specified, show to all
    if (!item.allowedRoles) return true;
    // If user has no role, hide
    if (!userRole) return false;
    // Check if user role is in allowedRoles
    return item.allowedRoles.includes(userRole);
  });

  // Filter subItems based on user role
  const navItemsWithFilteredSubItems = filteredNavItems
    .map((item) => {
      if (!item.subItems) return item;

      const filteredSubItems = item.subItems.filter((subItem) => {
        // If no allowedRoles specified, show to all
        if (!subItem.allowedRoles) return true;
        // If user has no role, hide
        if (!userRole) return false;
        // Check if user role is in allowedRoles
        return subItem.allowedRoles.includes(userRole);
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
                  src="/src/assets/image/logo.jpg"
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
                  src="/src/assets/image/logo.jpg"
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
                    className={`flex items-center font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 ${
                      isCollapsed ? "p-3 justify-center" : "p-3"
                    }`}
                    title={item.label}
                  >
                    <item.icon className="h-6 w-6" />
                    {!isCollapsed && (
                      <span className="ml-3 whitespace-nowrap">
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
                        className={`flex items-center w-full font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 ${
                          isCollapsed ? "p-3 justify-center" : "p-3"
                        }`}
                        title={item.label}
                        disabled={isCollapsed}
                      >
                        <item.icon className="h-6 w-6" />
                        {!isCollapsed && (
                          <>
                            <span className="ml-3 flex-grow text-left whitespace-nowrap">
                              {item.label}
                            </span>
                            <svg
                              className={`ml-2 w-4 h-4 transition-transform duration-200 ${
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
                          </>
                        )}
                      </button>

                      {/* Dropdown content */}
                      {!isCollapsed && item.subItems && (
                        <div
                          className={`overflow-hidden transition-all  hover:bg-gray-100 dark:hover:bg-gray-800 duration-300 ${
                            isDropdownOpen ? "max-h-40" : "max-h-0"
                          }`}
                        >
                          <ul className="ml-2 pl-6 border-l-2">
                            {item.subItems.map((subItem, subIndex) => (
                              <li key={subIndex}>
                                <Link
                                  to={subItem.path}
                                  className="flex items-center px-3 py-2 text-sm font-medium  hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                                >
                                  <subItem.icon className="h-5 w-5 mr-3" />
                                  {subItem.label}
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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4 border border-blue-100 dark:border-blue-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors duration-200">
                  {/* User Avatar */}
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {(user.name || user.email || user.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {user.name || user.email || user.username}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {user.role?.role_name || "User"}
                      </p>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span className="font-medium">Active</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <LocationMarkerIcon className="w-3 h-3 mr-2 text-gray-400 dark:text-gray-500" />
                      <span className="truncate">
                        {userBranch?.location || "Unknown Branch"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {(user.name || user.email || user.username || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 ${
              isCollapsed ? "p-3" : "px-3 py-2.5"
            }`}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isCollapsed ? (
              isDarkMode ? (
                <SunIcon className="h-6 w-6" />
              ) : (
                <MoonIcon className="h-6 w-6" />
              )
            ) : (
              <>
                {isDarkMode ? (
                  <>
                    <SunIcon className="h-5 w-5 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <MoonIcon className="h-5 w-5 mr-2" />
                    Dark Mode
                  </>
                )}
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            className={`flex items-center justify-center font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 shadow-sm ${
              isCollapsed ? "p-3" : "px-3 py-2.5"
            }`}
            title="Logout"
          >
            {isCollapsed ? <LogOutIcon className="h-6 w-6" /> : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
