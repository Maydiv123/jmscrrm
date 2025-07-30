"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Stage4Page() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    bill_no: '',
    bill_date: '',
    amount_taxable: 0,
    gst_5_percent: 0,
    gst_18_percent: 0,
    bill_mail: '',
    bill_courier: '',
    courier_date: '',
    acknowledge_date: '',
    acknowledge_name: ''
  });

  useEffect(() => {
    // Check current user
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      console.log("Current user:", user);
      setUserRole(user.role || 'customer');
      setIsAdmin(user.is_admin || false);
    }
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      console.log("Fetching jobs for stage4 employee...");
      
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
    // Pre-fill form with existing stage4 data if available
    if (job.stage4) {
      setFormData({
        bill_no: job.stage4.bill_no || '',
        bill_date: job.stage4.bill_date ? job.stage4.bill_date.split('T')[0] : '',
        amount_taxable: job.stage4.amount_taxable || 0,
        gst_5_percent: job.stage4.gst_5_percent || 0,
        gst_18_percent: job.stage4.gst_18_percent || 0,
        bill_mail: job.stage4.bill_mail || '',
        bill_courier: job.stage4.bill_courier || '',
        courier_date: job.stage4.courier_date ? job.stage4.courier_date.split('T')[0] : '',
        acknowledge_date: job.stage4.acknowledge_date ? job.stage4.acknowledge_date.split('T')[0] : '',
        acknowledge_name: job.stage4.acknowledge_name || ''
      });
    } else {
      // Reset form for new entry
      setFormData({
        bill_no: '',
        bill_date: '',
        amount_taxable: 0,
        gst_5_percent: 0,
        gst_18_percent: 0,
        bill_mail: '',
        bill_courier: '',
        courier_date: '',
        acknowledge_date: '',
        acknowledge_name: ''
      });
    }
    setShowUpdateModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const numberFields = ['amount_taxable', 'gst_5_percent', 'gst_18_percent'];
    
    setFormData(prev => ({
      ...prev,
      [name]: numberFields.includes(name) ? (parseFloat(value) || 0) : value
    }));
  };

  const fillTestData = () => {
    const testData = {
      bill_no: 'BILL2024001',
      bill_date: '2024-01-30',
      amount_taxable: 150000.00,
      gst_5_percent: 7500.00,
      gst_18_percent: 27000.00,
      bill_mail: 'billing@maydiv.com',
      bill_courier: 'DTDC Express',
      courier_date: '2024-01-31',
      acknowledge_date: '2024-02-02',
      acknowledge_name: 'John Smith'
    };
    setFormData(testData);
    alert('Test data filled! Please review and submit.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    console.log("Submitting stage4 data for job:", selectedJob.id);
    console.log("Form data:", formData);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${selectedJob.id}/stage4`, {
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
        alert("Billing information updated successfully!");
      } else {
        const errorData = await res.text();
        console.error("Error response:", errorData);
        alert("Error updating data: " + errorData);
      }
    } catch (err) {
      console.error("Error updating stage 4 data:", err);
      alert("Error updating data");
    }
  };

  const calculateTotal = () => {
    return formData.amount_taxable + formData.gst_5_percent + formData.gst_18_percent;
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
            <h1 className="text-3xl font-bold text-gray-900">Stage 4: Billing & Completion</h1>
            <p className="text-gray-600 mt-2">Manage billing information and job completion</p>
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
                            job.stage4 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {job.stage4 ? 'Data Entered' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleJobSelect(job)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            {job.stage4 ? 'Update' : 'Enter'} Data
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

      {/* Billing Modal */}
      {showUpdateModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Billing Information</h2>
                  <p className="text-gray-600">Job No: {selectedJob.job_no}</p>
                </div>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Shipment Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Shipment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Consignee:</strong> {selectedJob.stage1?.consignee || '-'}</div>
                  <div><strong>Commodity:</strong> {selectedJob.stage1?.commodity || '-'}</div>
                  <div><strong>Container:</strong> {selectedJob.stage1?.container_no || '-'}</div>
                  <div><strong>Weight:</strong> {selectedJob.stage1?.weight || 0} KG</div>
                  <div><strong>Duty Amount:</strong> ₹{selectedJob.stage2?.duty_amount || 0}</div>
                  <div><strong>Clearance Exp:</strong> ₹{selectedJob.stage3?.clearance_exps || 0}</div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Bill Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill No.</label>
                    <input
                      type="text"
                      name="bill_no"
                      value={formData.bill_no}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter bill number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
                    <input
                      type="date"
                      name="bill_date"
                      value={formData.bill_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                {/* Amount Details */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Billing Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount Taxable</label>
                      <input
                        type="number"
                        name="amount_taxable"
                        value={formData.amount_taxable}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST 5%</label>
                      <input
                        type="number"
                        name="gst_5_percent"
                        value={formData.gst_5_percent}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST 18%</label>
                      <input
                        type="number"
                        name="gst_18_percent"
                        value={formData.gst_18_percent}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <div className="text-lg font-semibold text-blue-900">
                      Total Amount: ₹{calculateTotal().toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill Mail</label>
                    <input
                      type="email"
                      name="bill_mail"
                      value={formData.bill_mail}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Email address for bill"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill Courier</label>
                    <input
                      type="text"
                      name="bill_courier"
                      value={formData.bill_courier}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Courier service used"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Courier Date</label>
                  <input
                    type="date"
                    name="courier_date"
                    value={formData.courier_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* Acknowledgment */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Acknowledgment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Acknowledge Date</label>
                      <input
                        type="date"
                        name="acknowledge_date"
                        value={formData.acknowledge_date}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Acknowledged By</label>
                      <input
                        type="text"
                        name="acknowledge_name"
                        value={formData.acknowledge_name}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Name of person acknowledging"
                      />
                    </div>
                  </div>
                  {formData.acknowledge_date && (
                    <div className="mt-3 p-3 bg-green-50 rounded-md">
                      <div className="text-sm text-green-800">
                        ✓ Acknowledging this bill will mark the job as completed.
                      </div>
                    </div>
                  )}
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
                      {formData.acknowledge_date ? 'Complete Job' : 'Save Billing Info'}
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