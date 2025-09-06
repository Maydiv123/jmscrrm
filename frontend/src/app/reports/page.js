"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [consignees, setConsignees] = useState([]);
  const [selectedConsignee, setSelectedConsignee] = useState("");
  const [downloading, setDownloading] = useState(false);

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

  async function downloadExcelReport() {
    if (!selectedConsignee) {
      alert("Please select a consignee first");
      return;
    }

    setDownloading(true);
    try {
      // Get consignee name
      const consignee = consignees.find(c => c.id.toString() === selectedConsignee);
      const consigneeName = consignee?.name || "Unknown";

      // Fetch jobs for selected consignee
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/consignees/${selectedConsignee}/jobs`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const jobs = await response.json();

      // Helper function to get stage name
      const getStageName = (stage) => {
        switch (stage) {
          case 'stage1': return 'Initial Setup';
          case 'stage2': return 'Customs & Docs';
          case 'stage3': return 'Clearance & Logistics';
          case 'stage4': return 'Billing';
          case 'completed': return 'Completed';
          default: return stage || 'Unknown';
        }
      };

      // Prepare data for Excel
      const excelData = jobs.map((job, index) => {
        const stage1 = job.Stage1 || {};
        const stage2 = job.Stage2 || {};
        
        return {
          "JOB NO": job.job_no || "",
          "CONSIGNEE NAME": stage1.consignee || consigneeName,
          "SUPPLIER NAME": stage1.shipper || "",
          "INVOICE NO": stage1.invoice_no || "",
          "COMMODITY": stage1.commodity || "",
          "MBL NO": stage1.mbl_no || "",
          "HBL NO": stage1.hbl_no || "",
          "CONTAINER NO": stage1.container_no || "",
          "SIZE": stage1.container_size || "",
          "ETA": stage1.eta ? new Date(stage1.eta).toLocaleDateString() : "",
          "BOE NO": stage2.bill_of_entry_no || "",
          "DATE": stage2.bill_of_entry_date ? new Date(stage2.bill_of_entry_date).toLocaleDateString() : "",
          "STAGE": getStageName(job.current_stage)
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // JOB NO
        { wch: 20 }, // CONSIGNEE NAME
        { wch: 20 }, // SUPPLIER NAME
        { wch: 15 }, // INVOICE NO
        { wch: 15 }, // COMMODITY
        { wch: 15 }, // MBL NO
        { wch: 15 }, // HBL NO
        { wch: 15 }, // CONTAINER NO
        { wch: 8 },  // SIZE
        { wch: 12 }, // ETA
        { wch: 15 }, // BOE NO
        { wch: 12 }, // DATE
        { wch: 20 }  // STAGE
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Jobs Report");

      // Generate filename
      const fileName = `Jobs_Report_${consigneeName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(wb, fileName);

      alert(`Excel report downloaded successfully! ${jobs.length} jobs found.`);
    } catch (error) {
      console.error("Error downloading Excel report:", error);
      alert("Error downloading Excel report. Please try again.");
    } finally {
      setDownloading(false);
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
          <h1 className="text-2xl font-bold mb-6 text-black">Reports</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-black">Download Excel Report</h2>
            <p className="text-black mb-4">Select a consignee to download all their jobs in Excel format</p>
            <div className="flex items-center space-x-4">
              <div className="w-64">
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  value={selectedConsignee}
                  onChange={(e) => setSelectedConsignee(e.target.value)}
                >
                  <option value="" className="text-black">Select Consignee</option>
                  {consignees.map((consignee) => (
                    <option key={consignee.id} value={consignee.id} className="text-black">
                      {consignee.name || `Consignee ${consignee.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                disabled={!selectedConsignee || downloading}
                onClick={downloadExcelReport}
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download Excel Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
