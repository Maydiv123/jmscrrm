"use client";
import { useEffect } from "react";
import Navigation from "../../components/Navigation";

export default function TasksPage() {
  useEffect(() => {
    // Redirect to pipeline page since we've migrated to the new system
    window.location.href = "/pipeline";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to Pipeline Management...</p>
        </div>
      </div>
    </div>
  );
} 