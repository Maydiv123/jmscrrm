"use client";
import { useState, useEffect } from "react";

export default function Navigation() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  function checkAuth() {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setIsAdmin(parsed.is_admin);
      }
    } catch (err) {
      console.error("Error parsing user data:", err);
    }
  }

  async function handleLogout() {
    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/logout", {
        method: "POST",
        credentials: "include"
      });
      localStorage.removeItem("user");
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a
                href={isAdmin ? "/dashboard/admin" : "/dashboard/employee"}
                className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Dashboard
              </a>
              {isAdmin && (
                <>
                  <a
                    href="/pipeline"
                    className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                  >
                    Pipeline
                  </a>
                  <a
                    href="/users"
                    className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                  >
                    Users
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-sm text-gray-700">
                  Welcome, <span className="font-medium">{user.username}</span>
                  {isAdmin && <span className="ml-1 text-blue-600">(Admin)</span>}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <a
            href={isAdmin ? "/dashboard/admin" : "/dashboard/employee"}
            className="text-gray-900 block px-3 py-2 text-base font-medium hover:text-blue-600 transition-colors"
          >
            Dashboard
          </a>
          {isAdmin && (
            <>
              <a
                href="/pipeline"
                className="text-gray-500 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors"
              >
                Pipeline
              </a>
              <a
                href="/users"
                className="text-gray-500 hover:text-gray-900 block px-3 py-2 text-base font-medium transition-colors"
              >
                Users
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
} 