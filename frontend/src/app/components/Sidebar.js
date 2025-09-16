"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ userRole, isAdmin }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(userRole);
  const [currentIsAdmin, setCurrentIsAdmin] = useState(isAdmin);
  const pathname = usePathname();

  useEffect(() => {
    // Get user info from localStorage if not provided as props
    if (!userRole || isAdmin === undefined) {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserRole(user.role || 'stage1_employee');
        setCurrentIsAdmin(user.is_admin || false);
      }
    } else {
      setCurrentUserRole(userRole);
      setCurrentIsAdmin(isAdmin);
    }
  }, [userRole, isAdmin]);

  const adminMenuItems = [
    { name: "Dashboard", href: "/dashboard/admin", icon: "📊" },
    { name: "Pipeline", href: "/pipeline", icon: "🔄" },
    { name: "Users", href: "/users", icon: "👥" },
    { name: "Analytics", href: "/analytics", icon: "📈" },
    { name: "Reports", href: "/reports", icon: "📋" },
    { name: "Consignee", href: "/consignee", icon: "🏢" },
    { name: "Shipper", href: "/shipper", icon: "🚢" },
  ];

  const subadminMenuItems = [
    { name: "Dashboard", href: "/dashboard/subadmin", icon: "📊" },
    // { name: "My Tasks", href: getTaskPage(currentUserRole), icon: "✅" },
    { name: "Pipeline", href: "/pipeline", icon: "🔄" },
    { name: "Reports", href: "/reports", icon: "📋" },
    { name: "Consignee", href: "/consignee", icon: "🏢" },
    { name: "Shipper", href: "/shipper", icon: "🚢" },
    { name: "Profile", href: "/profile", icon: "👤" },
  ];

  const employeeMenuItems = [
    { name: "Dashboard", href: "/dashboard/employee", icon: "📊" },
    { name: "My Tasks", href: getTaskPage(currentUserRole), icon: "✅" },
    { name: "Pipeline", href: "/pipeline", icon: "🔄" },
    { name: "Reports", href: "/reports", icon: "📋" },
    { name: "Consignee", href: "/consignee", icon: "🏢" },
    { name: "Shipper", href: "/shipper", icon: "🚢" },
    { name: "Profile", href: "/profile", icon: "👤" },
  ];

  const stage1EmployeeMenuItems = [
    { name: "Dashboard", href: "/dashboard/employee", icon: "📊" },
    { name: "My Tasks", href: getTaskPage(currentUserRole), icon: "✅" },
    { name: "Pipeline", href: "/pipeline", icon: "🔄" },
    { name: "Reports", href: "/reports", icon: "📋" },
    { name: "Consignee", href: "/consignee", icon: "🏢" },
    { name: "Shipper", href: "/shipper", icon: "🚢" },
    { name: "Profile", href: "/profile", icon: "👤" },
  ];

  function getTaskPage(role) {
    switch (role) {
      case 'stage1_employee': return "/pipeline";
      case 'stage2_employee': return "/stage2";
      case 'stage3_employee': return "/stage3";
      case 'customer': return "/stage4";
      case 'subadmin': return "/tasks";
      default: return "/pipeline";
    }
  }

  // Determine which menu to show based on user role
  let menuItems;
  if (currentIsAdmin) {
    menuItems = adminMenuItems;
  } else if (currentUserRole === 'subadmin') {
    menuItems = subadminMenuItems;
  } else if (currentUserRole === 'stage1_employee') {
    menuItems = stage1EmployeeMenuItems;
  } else {
    menuItems = employeeMenuItems;
  }

  const handleLogout = async () => {
    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("user");
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className={`bg-white shadow-lg h-screen fixed left-0 top-0 z-50 transition-all duration-300 ${
      isCollapsed ? "w-16" : "w-64"
    }`}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">J</span>
            </div>
            <span className="font-bold text-gray-800">Job Management System</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-gray-100"
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {currentIsAdmin ? "A" : currentUserRole === 'subadmin' ? "S" : "E"}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-800">
                {currentIsAdmin ? "Administrator" : currentUserRole === 'subadmin' ? "Subadmin" : "Employee"}
              </p>
              <p className="text-sm text-gray-500 capitalize">
                {currentUserRole?.replace('_', ' ') || 'User'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="mt-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
        >
          <span className="text-lg mr-3">🚪</span>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
} 