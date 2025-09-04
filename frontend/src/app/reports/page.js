"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [consignees, setConsignees] = useState([]);
  const [selectedConsignee, setSelectedConsignee] = useState("");

  useEffect(() => {
    fetchConsignees();
  }, []);

  async function fetchConsignees() {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/consignees",
        { credentials: "include" }
      );

      if (response.status === 403) {
        window.location.href = "/login";
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setConsignees(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching consignees:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading consignees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-6">Reports</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Select Consignee</h2>
            <div className="flex items-center space-x-4">
              <div className="w-64">
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedConsignee}
                  onChange={(e) => setSelectedConsignee(e.target.value)}
                >
                  <option value="">Select Consignee</option>
                  {consignees.map((consignee) => (
                    <option key={consignee.id} value={consignee.id}>
                      {consignee.name || `Consignee ${consignee.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedConsignee}
                onClick={() => {
                  console.log("Selected consignee:", selectedConsignee);
                  // Add your report generation logic here
                }}
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
