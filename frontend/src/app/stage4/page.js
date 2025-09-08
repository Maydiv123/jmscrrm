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
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual stage advancement handler
  const handleAdvanceStage = async (jobId, targetStage) => {
    if (!confirm(`Are you sure you want to advance this job to ${targetStage}?`)) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${jobId}/advance-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetStage })
      });

      if (res.ok) {
        const responseData = await res.json();
        console.log("Stage advancement success:", responseData);
        alert(`Job successfully advanced to ${targetStage}!`);
        await fetchJobs(); // Refresh the jobs list
      } else {
        const errorData = await res.text();
        console.error("Error advancing stage:", errorData);
        alert("Error advancing stage: " + errorData);
      }
    } catch (err) {
      console.error("Error advancing stage:", err);
      alert("Error advancing stage");
    }
  };

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

  // Validation functions
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'bill_no':
        if (!value.trim()) error = 'Bill number is required';
        else if (value.length < 2) error = 'Bill number must be at least 2 characters';
        break;
      case 'bill_date':
        if (!value) error = 'Bill date is required';
        else if (new Date(value) > new Date()) error = 'Bill date cannot be in the future';
        break;
      case 'amount_taxable':
        if (value < 0) error = 'Taxable amount cannot be negative';
        else if (value > 999999.99) error = 'Taxable amount cannot exceed 999,999.99';
        break;
      case 'gst_5_percent':
        if (value < 0) error = 'GST 5% cannot be negative';
        else if (value > 999999.99) error = 'GST 5% cannot exceed 999,999.99';
        break;
      case 'gst_18_percent':
        if (value < 0) error = 'GST 18% cannot be negative';
        else if (value > 999999.99) error = 'GST 18% cannot exceed 999,999.99';
        break;
      case 'bill_mail':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Please enter a valid email address';
        break;
      case 'bill_courier':
        if (value && value.length < 2) error = 'Bill courier must be at least 2 characters';
        break;
      case 'courier_date':
        if (value && new Date(value) > new Date()) error = 'Courier date cannot be in the future';
        break;
      case 'acknowledge_date':
        if (value && new Date(value) > new Date()) error = 'Acknowledge date cannot be in the future';
        break;
      case 'acknowledge_name':
        if (value && value.length < 2) error = 'Acknowledge name must be at least 2 characters';
        break;
      default:
        break;
    }
    
    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    if (!formData.bill_no.trim()) {
      newErrors.bill_no = 'Bill number is required';
    }
    if (!formData.bill_date) {
      newErrors.bill_date = 'Bill date is required';
    }
    if (!formData.amount_taxable || formData.amount_taxable <= 0) {
      newErrors.amount_taxable = 'Taxable amount is required and must be greater than 0';
    }
    
    // Validate all other fields
    Object.keys(formData).forEach(field => {
      if (formData[field] !== '' && formData[field] !== 0) {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = value;
    
    if (type === 'number') {
      newValue = value === '' ? 0 : parseFloat(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

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

  const handleJobSelect = async (job) => {
    try {
      // Fetch the complete job data including all stage data
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${job.id}`, {
        credentials: "include"
      });
      
      if (res.ok) {
        const completeJob = await res.json();
        console.log("Complete job data for Stage 4:", completeJob);
        setSelectedJob(completeJob);
        
        // Pre-fill form with existing stage4 data if available
        const stage4Data = completeJob.stage4 || completeJob.Stage4;
        if (stage4Data) {
          setFormData({
            bill_no: stage4Data.bill_no || '',
            bill_date: stage4Data.bill_date ? stage4Data.bill_date.split('T')[0] : '',
            amount_taxable: stage4Data.amount_taxable || 0,
            gst_5_percent: stage4Data.gst_5_percent || 0,
            gst_18_percent: stage4Data.gst_18_percent || 0,
            bill_mail: stage4Data.bill_mail || '',
            bill_courier: stage4Data.bill_courier || '',
            courier_date: stage4Data.courier_date ? stage4Data.courier_date.split('T')[0] : '',
            acknowledge_date: stage4Data.acknowledge_date ? stage4Data.acknowledge_date.split('T')[0] : '',
            acknowledge_name: stage4Data.acknowledge_name || ''
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
      } else {
        console.error("Failed to fetch complete job data");
        alert("Failed to load job details");
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      alert("Error loading job details");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting stage4 data for job:", selectedJob.id);
    console.log("Form data:", formData);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${selectedJob.id}/stage4`, {
        method: "POST",
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
        setErrors({});
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
    } finally {
      setIsSubmitting(false);
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
                          {job.stage4 && job.current_stage === 'stage4' && (
                            <button
                              onClick={() => handleAdvanceStage(job.id, 'completed')}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              Complete Job
                            </button>
                          )}
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
                  <div><strong>Consignee:</strong> {selectedJob.stage1?.consignee || selectedJob.Stage1?.consignee || '-'}</div>
                  <div><strong>Commodity:</strong> {selectedJob.stage1?.commodity || selectedJob.Stage1?.commodity || '-'}</div>
                  <div><strong>Container:</strong> {selectedJob.stage1?.container_no || selectedJob.Stage1?.container_no || '-'}</div>
                  <div><strong>Weight:</strong> {selectedJob.stage1?.weight || selectedJob.Stage1?.weight || 0} KG</div>
                  <div><strong>Duty Amount:</strong> ₹{selectedJob.stage2?.duty_amount || selectedJob.Stage2?.duty_amount || 0}</div>
                  <div><strong>Clearance Exp:</strong> ₹{selectedJob.stage3?.clearance_exps || selectedJob.Stage3?.clearance_exps || 0}</div>
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      placeholder="Enter bill number"
                    />
                    {errors.bill_no && <p className="text-red-500 text-xs mt-1">{errors.bill_no}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
                    <input
                      type="date"
                      name="bill_date"
                      value={formData.bill_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                    {errors.bill_date && <p className="text-red-500 text-xs mt-1">{errors.bill_date}</p>}
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
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                        step="0.01"
                      />
                      {errors.amount_taxable && <p className="text-red-500 text-xs mt-1">{errors.amount_taxable}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST 5%</label>
                      <input
                        type="number"
                        name="gst_5_percent"
                        value={formData.gst_5_percent}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                        step="0.01"
                      />
                      {errors.gst_5_percent && <p className="text-red-500 text-xs mt-1">{errors.gst_5_percent}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST 18%</label>
                      <input
                        type="number"
                        name="gst_18_percent"
                        value={formData.gst_18_percent}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                        step="0.01"
                      />
                      {errors.gst_18_percent && <p className="text-red-500 text-xs mt-1">{errors.gst_18_percent}</p>}
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      placeholder="Email address for bill"
                    />
                    {errors.bill_mail && <p className="text-red-500 text-xs mt-1">{errors.bill_mail}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill Courier</label>
                    <input
                      type="text"
                      name="bill_courier"
                      value={formData.bill_courier}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      placeholder="Courier service used"
                    />
                    {errors.bill_courier && <p className="text-red-500 text-xs mt-1">{errors.bill_courier}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Courier Date</label>
                  <input
                    type="date"
                    name="courier_date"
                    value={formData.courier_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                  />
                  {errors.courier_date && <p className="text-red-500 text-xs mt-1">{errors.courier_date}</p>}
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
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      />
                      {errors.acknowledge_date && <p className="text-red-500 text-xs mt-1">{errors.acknowledge_date}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Acknowledged By</label>
                      <input
                        type="text"
                        name="acknowledge_name"
                        value={formData.acknowledge_name}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                        placeholder="Name of person acknowledging"
                      />
                      {errors.acknowledge_name && <p className="text-red-500 text-xs mt-1">{errors.acknowledge_name}</p>}
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

                <div className="flex justify-end pt-6">
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