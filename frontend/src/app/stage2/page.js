"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Stage2Page() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    hsn_code: '',
    filing_requirement: '',
    checklist_sent_date: '',
    approval_date: '',
    bill_of_entry_no: '',
    bill_of_entry_date: '',
    debit_note: '',
    debit_paid_by: '',
    duty_amount: 0,
    duty_paid_by: '',
    ocean_freight: 0,
    destination_charges: 0,
    original_doct_recd_date: '',
    drn_no: '',
    irn_no: '',
    documents_type: ''
  });

  useEffect(() => {
    // Check current user
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      console.log("Current user:", user);
      setUserRole(user.role || 'stage2_employee');
      setIsAdmin(user.is_admin || false);
    }
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      console.log("Fetching jobs for stage2 employee...");
      
      // First, let's check the debug endpoint to see what's in the database
      const debugRes = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/debug", { 
        credentials: "include" 
      });
      if (debugRes.ok) {
        const debugData = await debugRes.json();
        console.log("Debug data:", debugData);
      }
      
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/pipeline/myjobs", { 
        credentials: "include" 
      });

      console.log("Response status:", res.status);

      if (res.status === 401 || res.status === 403) {
        console.log("Unauthorized, redirecting to login");
        window.location.href = "/login";
        return;
      }

      if (res.ok) {
        const data = await res.json();
        console.log("Received jobs data:", data);
        setJobs(Array.isArray(data) ? data : []);
      } else {
        const errorText = await res.text();
        console.error("Error response:", errorText);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    // Pre-fill form with existing stage2 data if available
    if (job.stage2) {
      setFormData({
        hsn_code: job.stage2.hsn_code || '',
        filing_requirement: job.stage2.filing_requirement || '',
        checklist_sent_date: job.stage2.checklist_sent_date ? job.stage2.checklist_sent_date.split('T')[0] : '',
        approval_date: job.stage2.approval_date ? job.stage2.approval_date.split('T')[0] : '',
        bill_of_entry_no: job.stage2.bill_of_entry_no || '',
        bill_of_entry_date: job.stage2.bill_of_entry_date ? job.stage2.bill_of_entry_date.split('T')[0] : '',
        debit_note: job.stage2.debit_note || '',
        debit_paid_by: job.stage2.debit_paid_by || '',
        duty_amount: job.stage2.duty_amount || 0,
        duty_paid_by: job.stage2.duty_paid_by || '',
        ocean_freight: job.stage2.ocean_freight || 0,
        destination_charges: job.stage2.destination_charges || 0,
        original_doct_recd_date: job.stage2.original_doct_recd_date ? job.stage2.original_doct_recd_date.split('T')[0] : '',
        drn_no: job.stage2.drn_no || '',
        irn_no: job.stage2.irn_no || '',
        documents_type: job.stage2.documents_type || ''
      });
    } else {
      // Reset form for new entry
      setFormData({
        hsn_code: '', filing_requirement: '', checklist_sent_date: '', approval_date: '',
        bill_of_entry_no: '', bill_of_entry_date: '', debit_note: '', debit_paid_by: '',
        duty_amount: 0, duty_paid_by: '', ocean_freight: 0, destination_charges: 0,
        original_doct_recd_date: '', drn_no: '', irn_no: '', documents_type: ''
      });
    }
    setShowUpdateModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const fillTestData = () => {
    const testData = {
      hsn_code: 'HSN123456',
      filing_requirement: 'Complete customs documentation required including invoice, packing list, and certificate of origin',
      checklist_sent_date: '2024-01-15',
      approval_date: '2024-01-20',
      bill_of_entry_no: 'BE2024001',
      bill_of_entry_date: '2024-01-22',
      debit_note: 'DN2024001',
      debit_paid_by: 'Customer',
      duty_amount: 25000.00,
      duty_paid_by: 'Customer',
      ocean_freight: 15000.00,
      destination_charges: 5000.00,
      original_doct_recd_date: '2024-01-18',
      drn_no: 'DRN2024001',
      irn_no: 'IRN2024001',
      documents_type: 'Commercial Invoice, Packing List, Certificate of Origin, Bill of Lading'
    };
    setFormData(testData);
    alert('Test data filled! Please review and submit.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    console.log("Submitting stage2 data for job:", selectedJob.id);
    console.log("Form data:", formData);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${selectedJob.id}/stage2`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      console.log("Response status:", res.status);
      
      if (res.ok) {
        const responseData = await res.json();
        console.log("Success response:", responseData);
        setShowUpdateModal(false);
        setSelectedJob(null);
        console.log("Refreshing jobs list...");
        await fetchJobs(); // Refresh the jobs list
        console.log("Jobs list refreshed");
        alert("Stage 2 data updated successfully!");
      } else {
        const errorData = await res.text();
        console.error("Error response:", errorData);
        alert("Error updating data: " + errorData);
      }
    } catch (err) {
      console.error("Error updating stage 2 data:", err);
      alert("Error updating data");
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'stage1': return 'bg-blue-100 text-blue-800';
      case 'stage2': return 'bg-yellow-100 text-yellow-800';
      case 'stage3': return 'bg-purple-100 text-purple-800';
      case 'stage4': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole={userRole} isAdmin={isAdmin} />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Stage 2: Customs & Documentation</h1>
            <p className="text-gray-600 mt-2">Process customs documentation and filing requirements</p>
          </div>

          {/* Jobs assigned to me */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Jobs Assigned to Me</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consignee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commodity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No jobs assigned to you yet.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {job.job_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(job.current_stage)}`}>
                            {job.current_stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.stage1?.consignee || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.stage1?.commodity || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            job.stage2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {job.stage2 ? 'Data Entered' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleJobSelect(job)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            {job.stage2 ? 'Update' : 'Enter'} Data
                          </button>
                          <button
                            onClick={() => window.location.href = `/pipeline/jobs/${job.id}`}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Stage 2: Customs & Documentation</h2>
                  <p className="text-gray-600">Job No: {selectedJob.job_no}</p>
                </div>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Job Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Job Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Consignee:</strong> {selectedJob.stage1?.consignee || '-'}</div>
                  <div><strong>Shipper:</strong> {selectedJob.stage1?.shipper || '-'}</div>
                  <div><strong>Commodity:</strong> {selectedJob.stage1?.commodity || '-'}</div>
                  <div><strong>Invoice No:</strong> {selectedJob.stage1?.invoice_no || '-'}</div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* HSN Code and Filing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                    <input
                      type="text"
                      name="hsn_code"
                      value={formData.hsn_code}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Documents Type</label>
                    <input
                      type="text"
                      name="documents_type"
                      value={formData.documents_type}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filing Requirement</label>
                  <textarea
                    name="filing_requirement"
                    value={formData.filing_requirement}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    rows="3"
                  />
                </div>

                {/* Checklist and Approval */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Checklist Sent Date</label>
                    <input
                      type="date"
                      name="checklist_sent_date"
                      value={formData.checklist_sent_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approval Date</label>
                    <input
                      type="date"
                      name="approval_date"
                      value={formData.approval_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* Bill of Entry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill of Entry No.</label>
                    <input
                      type="text"
                      name="bill_of_entry_no"
                      value={formData.bill_of_entry_no}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill of Entry Date</label>
                    <input
                      type="date"
                      name="bill_of_entry_date"
                      value={formData.bill_of_entry_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* Debit Note */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Debit Note</label>
                    <input
                      type="text"
                      name="debit_note"
                      value={formData.debit_note}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Debit Paid By</label>
                    <input
                      type="text"
                      name="debit_paid_by"
                      value={formData.debit_paid_by}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* Duty Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duty Amount</label>
                    <input
                      type="number"
                      name="duty_amount"
                      value={formData.duty_amount}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duty Paid By</label>
                    <input
                      type="text"
                      name="duty_paid_by"
                      value={formData.duty_paid_by}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* Freight and Charges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ocean Freight</label>
                    <input
                      type="number"
                      name="ocean_freight"
                      value={formData.ocean_freight}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination Charges</label>
                    <input
                      type="number"
                      name="destination_charges"
                      value={formData.destination_charges}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Document Receipt and Reference Numbers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Original Document Received Date</label>
                    <input
                      type="date"
                      name="original_doct_recd_date"
                      value={formData.original_doct_recd_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DRN No.</label>
                    <input
                      type="text"
                      name="drn_no"
                      value={formData.drn_no}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IRN No.</label>
                    <input
                      type="text"
                      name="irn_no"
                      value={formData.irn_no}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={fillTestData}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Fill Test Data
                  </button>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowUpdateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Stage 2 Data
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 