"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check user role and redirect to appropriate dashboard
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.is_admin) {
          router.push("/dashboard/admin");
        } else if (user.role === 'subadmin') {
          router.push("/dashboard/subadmin");
        } else {
          router.push("/dashboard/employee");
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
        router.push("/login");
      }
    } else {
      // No user data, redirect to login
      router.push("/login");
    }
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
