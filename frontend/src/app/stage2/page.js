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
    documents_type: '',
    // Moved fields from Stage 1
    invoice_no: '',
    gateway_igm: '',
    gateway_igm_date: '',
    local_igm: '',
    local_igm_date: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Validation functions
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'hsn_code':
        if (value && value.length < 2) error = 'HSN code must be at least 2 characters';
        else if (value && !/^[0-9]+$/.test(value)) error = 'HSN code must contain only numbers';
        break;
      case 'filing_requirement':
        if (value && value.length < 3) error = 'Filing requirement must be at least 3 characters';
        break;
      case 'checklist_sent_date':
        if (value && new Date(value) > new Date()) error = 'Checklist sent date cannot be in the future';
        break;
      case 'approval_date':
        if (value && new Date(value) > new Date()) error = 'Approval date cannot be in the future';
        break;
      case 'bill_of_entry_no':
        if (value && value.length < 2) error = 'Bill of entry number must be at least 2 characters';
        break;
      case 'bill_of_entry_date':
        if (value && new Date(value) > new Date()) error = 'Bill of entry date cannot be in the future';
        break;
      case 'debit_note':
        if (value && value.length < 2) error = 'Debit note must be at least 2 characters';
        break;
      case 'debit_paid_by':
        if (value && value.length < 2) error = 'Debit paid by must be at least 2 characters';
        break;
      case 'duty_amount':
        if (value && value !== '') {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) error = 'Duty amount must be a valid number';
          else if (numValue < 0) error = 'Duty amount cannot be negative';
          else if (numValue > 999999.99) error = 'Duty amount cannot exceed 999,999.99';
        }
        break;
      case 'duty_paid_by':
        if (value && value.length < 2) error = 'Duty paid by must be at least 2 characters';
        break;
      case 'ocean_freight':
        if (value && value !== '') {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) error = 'Ocean freight must be a valid number';
          else if (numValue < 0) error = 'Ocean freight cannot be negative';
          else if (numValue > 999999.99) error = 'Ocean freight cannot exceed 999,999.99';
        }
        break;
      case 'destination_charges':
        if (value && value !== '') {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) error = 'Destination charges must be a valid number';
          else if (numValue < 0) error = 'Destination charges cannot be negative';
          else if (numValue > 999999.99) error = 'Destination charges cannot exceed 999,999.99';
        }
        break;
      case 'original_doct_recd_date':
        if (value && new Date(value) > new Date()) error = 'Original documents received date cannot be in the future';
        break;
      case 'drn_no':
        if (value && value.length < 2) error = 'DRN number must be at least 2 characters';
        break;
      case 'irn_no':
        if (value && value.length < 2) error = 'IRN number must be at least 2 characters';
        break;
      case 'documents_type':
        if (value && value.length < 2) error = 'Documents type must be at least 2 characters';
        break;
      case 'invoice_no':
        if (value && value.length < 2) error = 'Invoice number must be at least 2 characters';
        break;
      case 'gateway_igm':
        if (value && value.length < 2) error = 'Gateway IGM must be at least 2 characters';
        break;
      case 'gateway_igm_date':
        if (value && new Date(value) > new Date()) error = 'Gateway IGM date cannot be in the future';
        break;
      case 'local_igm':
        if (value && value.length < 2) error = 'Local IGM must be at least 2 characters';
        break;
      case 'local_igm_date':
        if (value && new Date(value) > new Date()) error = 'Local IGM date cannot be in the future';
        break;
      default:
        break;
    }
    
    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    if (!formData.hsn_code.trim()) {
      newErrors.hsn_code = 'HSN code is required';
    }
    if (!formData.filing_requirement.trim()) {
      newErrors.filing_requirement = 'Filing requirement is required';
    }
    if (!formData.bill_of_entry_no.trim()) {
      newErrors.bill_of_entry_no = 'Bill of entry number is required';
    }
    if (!formData.duty_amount || formData.duty_amount <= 0) {
      newErrors.duty_amount = 'Duty amount is required and must be greater than 0';
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

  const handleJobSelect = async (job) => {
    try {
      // Fetch the complete job data including Stage2 data
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${job.id}`, {
        credentials: "include"
      });
      
      if (res.ok) {
        const completeJob = await res.json();
        console.log("Complete job data:", completeJob);
        setSelectedJob(completeJob);
        
        // Pre-fill form with existing stage2 data if available
        if (completeJob.stage2) {
          setFormData({
            hsn_code: completeJob.stage2.hsn_code || '',
            filing_requirement: completeJob.stage2.filing_requirement || '',
            checklist_sent_date: completeJob.stage2.checklist_sent_date ? completeJob.stage2.checklist_sent_date.split('T')[0] : '',
            approval_date: completeJob.stage2.approval_date ? completeJob.stage2.approval_date.split('T')[0] : '',
            bill_of_entry_no: completeJob.stage2.bill_of_entry_no || '',
            bill_of_entry_date: completeJob.stage2.bill_of_entry_date ? completeJob.stage2.bill_of_entry_date.split('T')[0] : '',
            debit_note: completeJob.stage2.debit_note || '',
            debit_paid_by: completeJob.stage2.debit_paid_by || '',
            duty_amount: completeJob.stage2.duty_amount || 0,
            duty_paid_by: completeJob.stage2.duty_paid_by || '',
            ocean_freight: completeJob.stage2.ocean_freight || 0,
            destination_charges: completeJob.stage2.destination_charges || 0,
            original_doct_recd_date: completeJob.stage2.original_doct_recd_date ? completeJob.stage2.original_doct_recd_date.split('T')[0] : '',
            drn_no: completeJob.stage2.drn_no || '',
            irn_no: completeJob.stage2.irn_no || '',
            documents_type: completeJob.stage2.documents_type || '',
            // Moved fields from Stage 1
            invoice_no: completeJob.stage2.invoice_no || completeJob.stage1?.invoice_no || '',
            gateway_igm: completeJob.stage2.gateway_igm || completeJob.stage1?.gateway_igm || '',
            gateway_igm_date: completeJob.stage2.gateway_igm_date ? completeJob.stage2.gateway_igm_date.split('T')[0] : (completeJob.stage1?.gateway_igm_date ? completeJob.stage1.gateway_igm_date.split('T')[0] : ''),
            local_igm: completeJob.stage2.local_igm || completeJob.stage1?.local_igm || '',
            local_igm_date: completeJob.stage2.local_igm_date ? completeJob.stage2.local_igm_date.split('T')[0] : (completeJob.stage1?.local_igm_date ? completeJob.stage1.local_igm_date.split('T')[0] : '')
          });
        } else {
          // Reset form for new entry
          setFormData({
            hsn_code: '', filing_requirement: '', checklist_sent_date: '', approval_date: '',
            bill_of_entry_no: '', bill_of_entry_date: '', debit_note: '', debit_paid_by: '',
            duty_amount: 0, duty_paid_by: '', ocean_freight: 0, destination_charges: 0,
            original_doct_recd_date: '', drn_no: '', irn_no: '', documents_type: '',
            // Initialize Stage 1 fields
            invoice_no: completeJob.stage1?.invoice_no || '',
            gateway_igm: completeJob.stage1?.gateway_igm || '',
            gateway_igm_date: completeJob.stage1?.gateway_igm_date ? completeJob.stage1.gateway_igm_date.split('T')[0] : '',
            local_igm: completeJob.stage1?.local_igm || '',
            local_igm_date: completeJob.stage1?.local_igm_date ? completeJob.stage1.local_igm_date.split('T')[0] : ''
          });
        }
      } else {
        console.error("Failed to fetch complete job data");
        // Fallback to original job data
        setSelectedJob(job);
        setFormData({
          hsn_code: '', filing_requirement: '', checklist_sent_date: '', approval_date: '',
          bill_of_entry_no: '', bill_of_entry_date: '', debit_note: '', debit_paid_by: '',
          duty_amount: 0, duty_paid_by: '', ocean_freight: 0, destination_charges: 0,
          original_doct_recd_date: '', drn_no: '', irn_no: '', documents_type: ''
        });
      }
    } catch (error) {
      console.error("Error fetching complete job data:", error);
      // Fallback to original job data
      setSelectedJob(job);
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



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting stage2 data for job:", selectedJob.id);
    console.log("Form data:", formData);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${selectedJob.id}/stage2`, {
        method: "post",
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
        alert("Stage 2 data updated successfully!");
      } else {
        const errorData = await res.text();
        console.error("Error response:", errorData);
        alert("Error updating data: " + errorData);
      }
    } catch (err) {
      console.error("Error updating stage 2 data:", err);
      alert("Error updating data");
    } finally {
      setIsSubmitting(false);
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
                  onClick={() => {
                    setShowUpdateModal(false);
                    setErrors({});
                    setIsSubmitting(false);
                  }}
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
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.hsn_code ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.hsn_code && <p className="text-red-500 text-xs mt-1">{errors.hsn_code}</p>}
                  </div>

                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filing Requirement</label>
                  <textarea
                    name="filing_requirement"
                    value={formData.filing_requirement}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md px-3 py-2 text-black ${
                      errors.filing_requirement ? 'border-red-500' : 'border-gray-300'
                    }`}
                    rows="3"
                  />
                  {errors.filing_requirement && <p className="text-red-500 text-xs mt-1">{errors.filing_requirement}</p>}
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
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.checklist_sent_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.checklist_sent_date && <p className="text-red-500 text-xs mt-1">{errors.checklist_sent_date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approval Date</label>
                    <input
                      type="date"
                      name="approval_date"
                      value={formData.approval_date}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.approval_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.approval_date && <p className="text-red-500 text-xs mt-1">{errors.approval_date}</p>}
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
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.bill_of_entry_no ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.bill_of_entry_no && <p className="text-red-500 text-xs mt-1">{errors.bill_of_entry_no}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bill of Entry Date</label>
                    <input
                      type="date"
                      name="bill_of_entry_date"
                      value={formData.bill_of_entry_date}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.bill_of_entry_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.bill_of_entry_date && <p className="text-red-500 text-xs mt-1">{errors.bill_of_entry_date}</p>}
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
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.debit_note ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.debit_note && <p className="text-red-500 text-xs mt-1">{errors.debit_note}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Debit Paid By</label>
                    <input
                      type="text"
                      name="debit_paid_by"
                      value={formData.debit_paid_by}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.debit_paid_by ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.debit_paid_by && <p className="text-red-500 text-xs mt-1">{errors.debit_paid_by}</p>}
                  </div>
                </div>

                {/* Duty Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duty Amount</label>
                    <input
                      type="text"
                      name="duty_amount"
                      value={formData.duty_amount}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.duty_amount ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter amount"
                    />
                    {errors.duty_amount && <p className="text-red-500 text-xs mt-1">{errors.duty_amount}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duty Paid By</label>
                    <input
                      type="text"
                      name="duty_paid_by"
                      value={formData.duty_paid_by}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.duty_paid_by ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.duty_paid_by && <p className="text-red-500 text-xs mt-1">{errors.duty_paid_by}</p>}
                  </div>
                </div>

                {/* Freight and Charges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ocean Freight</label>
                    <input
                      type="text"
                      name="ocean_freight"
                      value={formData.ocean_freight}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.ocean_freight ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter amount"
                    />
                    {errors.ocean_freight && <p className="text-red-500 text-xs mt-1">{errors.ocean_freight}</p>}
                  </div>
                  <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination Charges</label>
                    <input
                      type="text"
                      name="destination_charges"
                      value={formData.destination_charges}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.destination_charges ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter amount"
                    />
                    {errors.destination_charges && <p className="text-red-500 text-xs mt-1">{errors.destination_charges}</p>}
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
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.original_doct_recd_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.original_doct_recd_date && <p className="text-red-500 text-xs mt-1">{errors.original_doct_recd_date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DRN No.</label>
                    <input
                      type="text"
                      name="drn_no"
                      value={formData.drn_no}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.drn_no ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.drn_no && <p className="text-red-500 text-xs mt-1">{errors.drn_no}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IRN No.</label>
                    <input
                      type="text"
                      name="irn_no"
                      value={formData.irn_no}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.irn_no ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.irn_no && <p className="text-red-500 text-xs mt-1">{errors.irn_no}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Documents Type</label>
                    <input
                      type="text"
                      name="documents_type"
                      value={formData.documents_type}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.documents_type ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.documents_type && <p className="text-red-500 text-xs mt-1">{errors.documents_type}</p>}
                  </div>
                </div>

                {/* Invoice No */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No.</label>
                  <input
                    type="text"
                    name="invoice_no"
                    value={formData.invoice_no}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md px-3 py-2 text-black ${
                      errors.invoice_no ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter invoice number"
                  />
                  {errors.invoice_no && <p className="text-red-500 text-xs mt-1">{errors.invoice_no}</p>}
                </div>

                {/* IGM Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gateway IGM</label>
                    <input
                      type="text"
                      name="gateway_igm"
                      value={formData.gateway_igm}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.gateway_igm ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter gateway IGM"
                    />
                    {errors.gateway_igm && <p className="text-red-500 text-xs mt-1">{errors.gateway_igm}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gateway IGM Date</label>
                    <input
                      type="date"
                      name="gateway_igm_date"
                      value={formData.gateway_igm_date}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.gateway_igm_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.gateway_igm_date && <p className="text-red-500 text-xs mt-1">{errors.gateway_igm_date}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local IGM</label>
                    <input
                      type="text"
                      name="local_igm"
                      value={formData.local_igm}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.local_igm ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter local IGM"
                    />
                    {errors.local_igm && <p className="text-red-500 text-xs mt-1">{errors.local_igm}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local IGM Date</label>
                    <input
                      type="date"
                      name="local_igm_date"
                      value={formData.local_igm_date}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.local_igm_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.local_igm_date && <p className="text-red-500 text-xs mt-1">{errors.local_igm_date}</p>}
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUpdateModal(false);
                        setErrors({});
                        setIsSubmitting(false);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 rounded-md text-white ${
                        isSubmitting 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Stage 2 Data'}
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
