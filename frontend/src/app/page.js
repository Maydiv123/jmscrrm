"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  async function checkAuthAndRedirect() {
    try {
      // Check if user data exists in localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        console.log("Found existing user data:", user);
        
        if (user.is_admin) {
          window.location.href = "/dashboard/admin";
          return;
        } else {
          window.location.href = "/dashboard/employee";
          return;
        }
      }
      
      // No user data in localStorage, redirect to login
      window.location.href = "/login";
    } catch (err) {
      console.error("Auth check error:", err);
      // On error, redirect to login
      window.location.href = "/login";
    }
  }

  // Show loading while checking authentication
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Jms CRM...</p>
      </div>
    </div>
  );
}
