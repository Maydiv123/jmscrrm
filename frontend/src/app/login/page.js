"use client";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      // Check if user data exists in localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        console.log("Found existing user data:", user);
        
        if (user.is_admin) {
          console.log("User already logged in as admin, redirecting...");
          window.location.href = "/dashboard/admin";
          return;
        } else {
          console.log("User already logged in as employee, redirecting...");
          window.location.href = "/dashboard/employee";
          return;
        }
      }
      
      // No user data in localStorage, show login page
      setCheckingAuth(false);
    } catch (err) {
      console.error("Auth check error:", err);
      // On error, show login page
      setCheckingAuth(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      console.log("Attempting login for username:", username);
      console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
      
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      
      console.log("Login response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Login response data:", data);
        
        // Store user info in localStorage
        localStorage.setItem("user", JSON.stringify({
          username: username,
          is_admin: data.is_admin,
          role: data.role || 'stage1_employee',
          timestamp: new Date().toISOString()
        }));
        
        if (data.is_admin) {
          console.log("Redirecting to admin dashboard");
          window.location.href = "/dashboard/admin";
        } else if (data.role === 'subadmin') {
          console.log("Redirecting to subadmin dashboard");
          window.location.href = "/dashboard/subadmin";
        } else {
          console.log("Redirecting to employee dashboard");
          window.location.href = "/dashboard/employee";
        }
      } else {
        const errorData = await res.text();
        console.log("Login error response:", errorData);
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl text-white font-bold">J</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Management System</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-600 mr-2">⚠️</span>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-xs">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-700">Admin User:</p>
                <p className="text-gray-600">Username: admin | Password: 123456</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-700">Employee User:</p>
                <p className="text-gray-600">Username: ravindra | Password: 123456</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            © 2024 MayDiv CRM. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
} 