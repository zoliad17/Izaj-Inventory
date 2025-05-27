import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  LocationMarkerIcon,
  CubeIcon,
  ClipboardListIcon,
  SwitchHorizontalIcon,
  CogIcon,
  UserCircleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  SearchIcon,
} from "@heroicons/react/outline";
import { useSidebar } from "./SidebarContext";

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
  role?: string;
}

function Sidebar() {
  const navigate = useNavigate();
  const userString = localStorage.getItem("user");
  const user: User | null = userString ? JSON.parse(userString) : null;
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const userRole = user?.role || localStorage.getItem("userRole");

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
      allowedRoles: ["admin", "branchManager", "superAdmin"],
    },
    {
      icon: LocationMarkerIcon,
      label: "Branch",
      path: "/branch_location",
      allowedRoles: ["admin", "branchManager", "superAdmin"],
    },
    {
      icon: ClipboardListIcon,
      label: "Branch Request",
      path: null,
      allowedRoles: ["admin", "branchManager", "superAdmin"],
      subItems: [
        {
          icon: ClipboardListIcon,
          label: "Pending Request",
          path: "/pending_request",
          allowedRoles: ["branchManager", "superAdmin"],
        },
        {
          icon: SwitchHorizontalIcon,
          label: "Transferred",
          path: "/transferred",
          allowedRoles: ["admin", "branchManager", "superAdmin"],
        },
        {
          icon: SwitchHorizontalIcon,
          label: "Send Request",
          path: "/send_request",
          allowedRoles: ["admin"],
        },
      ],
    },
    {
      icon: CubeIcon,
      label: "Sales",
      path: "/sales",
      allowedRoles: ["admin", "branchManager", "superAdmin"],
    },
    {
      icon: CubeIcon,
      label: "Stock",
      path: "/all_stock",
      allowedRoles: ["admin", "branchManager", "superAdmin"],
    },
    {
      icon: CogIcon,
      label: "Setting",
      path: "#",
      allowedRoles: ["admin", "branchManager", "superAdmin"],
    },
    {
      icon: UserCircleIcon,
      label: "User",
      path: "/add-user",
      allowedRoles: ["superAdmin", "branchManager"],
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

  return (
    <div
      className={`h-screen bg-white text-gray-800 fixed top-0 left-0 overflow-y-auto flex flex-col justify-between border-r border-gray-200 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-25" : "w-64"
      }`}
    >
      {/* Header Section */}
      <div>
        <div className="flex items-center p-4 justify-between border-b border-gray-200">
          {!isCollapsed ? (
            <div className="flex items-center">
              <img
                src="/src/assets/image/logo.jpg"
                alt="Logo"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="ml-3">
                <div className="text-lg font-semibold whitespace-nowrap">
                  IZAJ-LIGHTING
                </div>
              </div>
            </div>
          ) : (
            <img
              src="/src/assets/image/logo.jpg"
              alt="Logo"
              className="w-10 h-10 rounded-full object-cover mx-auto"
            />
          )}
          <button
            onClick={toggleSidebar}
            className="text-gray-500 cursor-pointer hover:text-gray-700 hover:bg-gray-100 p-1 rounded-md transition-colors duration-200"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronDoubleRightIcon className="h-5 w-5 ml-1.5" />
            ) : (
              <ChevronDoubleLeftIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Search Bar (only shown when expanded) */}
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
        )}

        {/* Navigation Section */}
        <nav className="px-2 py-4">
          <ul className="space-y-1">
            {navItemsWithFilteredSubItems.map((item, index) => (
              <li key={index}>
                {item.path ? (
                  // Regular navigation item
                  <Link
                    to={item.path}
                    className={`flex items-center font-medium hover:bg-gray-100 rounded-lg transition-all duration-200 ${
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
                        className={`flex items-center w-full font-medium hover:bg-gray-100 rounded-lg transition-all duration-200 ${
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
                          className={`overflow-hidden transition-all duration-300 ${
                            isDropdownOpen ? "max-h-40" : "max-h-0"
                          }`}
                        >
                          <ul className="ml-2 pl-6 border-l-2 border-gray-200">
                            {item.subItems.map((subItem, subIndex) => (
                              <li key={subIndex}>
                                <Link
                                  to={subItem.path}
                                  className="flex items-center px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg transition-all duration-200"
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
      <div className="p-3 border-t border-gray-200">
        <div className="flex flex-col space-y-2">
          {user && !isCollapsed && (
            <div className="px-3 py-2 text-sm font-medium text-gray-700 truncate">
              {user.email || user.username}
              {user.role && (
                <span className="block text-xs text-gray-500">{user.role}</span>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-200 ${
              isCollapsed ? "p-3" : "px-3 py-2"
            }`}
            title="Logout"
          >
            {isCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            ) : (
              "Logout"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
