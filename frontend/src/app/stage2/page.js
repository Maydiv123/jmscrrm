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
    ocean_freight: 0,
    original_doct_recd_date: '',
    drn_entries: [{ 
      drn_no: '', 
      irn_entries: [{ 
        irn_number: '', 
        documents_type: '' 
      }] 
    }], // Changed to array for multiple DRN entries with multiple IRN entries
    // Fields from Stage 1
    invoice_no: '',
    gateway_igm: '',
    gateway_igm_date: '',
    local_igm: '',
    local_igm_date: '',
    // EDI Information
    edi_job_no: '',
    edi_date: ''
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

  // Helper function to validate date
  const isValidDate = (dateString) => {
    if (!dateString) return true; // Empty dates are valid
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  // Functions to handle multiple DRN entries
  const addDrnEntry = () => {
    setFormData(prev => ({
      ...prev,
      drn_entries: [...prev.drn_entries, { 
        drn_no: '', 
        irn_entries: [{ irn_number: '', documents_type: '' }] 
      }]
    }));
  };

  const removeDrnEntry = (index) => {
    if (formData.drn_entries.length > 1) {
      setFormData(prev => ({
        ...prev,
        drn_entries: prev.drn_entries.filter((_, i) => i !== index)
      }));
    }
  };

  const updateDrnEntry = (drnIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      drn_entries: prev.drn_entries.map((entry, i) => 
        i === drnIndex ? { ...entry, [field]: value } : entry
      )
    }));
  };

  // Functions to handle multiple IRN entries within each DRN
  const addIrnEntry = (drnIndex) => {
    setFormData(prev => ({
      ...prev,
      drn_entries: prev.drn_entries.map((entry, i) => 
        i === drnIndex 
          ? { ...entry, irn_entries: [...entry.irn_entries, { irn_number: '', documents_type: '' }] }
          : entry
      )
    }));
  };

  const removeIrnEntry = (drnIndex, irnIndex) => {
    setFormData(prev => ({
      ...prev,
      drn_entries: prev.drn_entries.map((entry, i) => 
        i === drnIndex 
          ? { 
              ...entry, 
              irn_entries: entry.irn_entries.length > 1 
                ? entry.irn_entries.filter((_, j) => j !== irnIndex)
                : entry.irn_entries
            }
          : entry
      )
    }));
  };

  const updateIrnEntry = (drnIndex, irnIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      drn_entries: prev.drn_entries.map((entry, i) => 
        i === drnIndex 
          ? { 
              ...entry, 
              irn_entries: entry.irn_entries.map((irn, j) => 
                j === irnIndex ? { ...irn, [field]: value } : irn
              )
            }
          : entry
      )
    }));
  };

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
      case 'ocean_freight':
        if (value && value !== '') {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) error = 'Ocean freight must be a valid number';
          else if (numValue < 0) error = 'Ocean freight cannot be negative';
          else if (numValue > 999999.99) error = 'Ocean freight cannot exceed 999,999.99';
        }
        break;
      case 'original_doct_recd_date':
        if (value && new Date(value) > new Date()) error = 'Original documents received date cannot be in the future';
        break;
      case 'drn_entries':
        // Validate all DRN entries
        const drnErrors = formData.drn_entries.map((entry, drnIndex) => {
          if (entry.drn_no && entry.drn_no.length < 2) {
            return `DRN number ${drnIndex + 1} must be at least 2 characters`;
          }
          const irnErrors = entry.irn_entries.map((irn, irnIndex) => {
            if (irn.irn_number && irn.irn_number.length < 2) {
              return `IRN number ${irnIndex + 1} for DRN ${drnIndex + 1} must be at least 2 characters`;
            }
            if (irn.documents_type && irn.documents_type.length < 2) {
              return `Documents type for IRN ${irnIndex + 1} in DRN ${drnIndex + 1} must be at least 2 characters`;
            }
            return null;
          }).filter(Boolean);
          if (irnErrors.length > 0) return irnErrors[0];
          return null;
        }).filter(Boolean);
        if (drnErrors.length > 0) error = drnErrors[0];
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
      case 'edi_job_no':
        if (value && value.length < 2) error = 'EDI Job No must be at least 2 characters';
        break;
      case 'edi_date':
        if (value && new Date(value) > new Date()) error = 'EDI date cannot be in the future';
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
            ocean_freight: completeJob.stage2.ocean_freight || 0,
            original_doct_recd_date: completeJob.stage2.original_doct_recd_date ? completeJob.stage2.original_doct_recd_date.split('T')[0] : '',
            drn_entries: completeJob.stage2.drn_entries ? 
              completeJob.stage2.drn_entries.map(entry => ({
                drn_no: entry.drn_no || '',
                irn_entries: entry.irn_entries ? 
                  entry.irn_entries.map(irn => ({ 
                    irn_number: irn.irn_number || '', 
                    documents_type: irn.documents_type || '' 
                  })) : 
                  [{ irn_number: '', documents_type: '' }]
              })) : 
              [{ drn_no: '', irn_entries: [{ irn_number: '', documents_type: '' }] }],
            // Moved fields from Stage 1
            invoice_no: completeJob.stage2.invoice_no || completeJob.Stage1?.invoice_no || completeJob.stage1?.invoice_no || '',
            gateway_igm: completeJob.stage2.gateway_igm || completeJob.Stage1?.gateway_igm || completeJob.stage1?.gateway_igm || '',
            gateway_igm_date: completeJob.stage2.gateway_igm_date ? completeJob.stage2.gateway_igm_date.split('T')[0] : (completeJob.Stage1?.gateway_igm_date ? completeJob.Stage1.gateway_igm_date.split('T')[0] : (completeJob.stage1?.gateway_igm_date ? completeJob.stage1.gateway_igm_date.split('T')[0] : '')),
            local_igm: completeJob.stage2.local_igm || completeJob.Stage1?.local_igm || completeJob.stage1?.local_igm || '',
            local_igm_date: completeJob.stage2.local_igm_date ? completeJob.stage2.local_igm_date.split('T')[0] : (completeJob.Stage1?.local_igm_date ? completeJob.Stage1.local_igm_date.split('T')[0] : (completeJob.stage1?.local_igm_date ? completeJob.stage1.local_igm_date.split('T')[0] : '')),
            // EDI Information
            edi_job_no: completeJob.stage2.edi_job_no || '',
            edi_date: completeJob.stage2.edi_date ? completeJob.stage2.edi_date.split('T')[0] : ''
          });
        } else {
          // Reset form for new entry
          setFormData({
            hsn_code: '', 
            filing_requirement: '', 
            checklist_sent_date: '', 
            approval_date: '',
            bill_of_entry_no: '', 
            bill_of_entry_date: '', 
            ocean_freight: 0,
            original_doct_recd_date: '', 
            drn_entries: [{ drn_no: '', irn_entries: [{ irn_number: '', documents_type: '' }] }],
            // Initialize Stage 1 fields
            invoice_no: completeJob.Stage1?.invoice_no || completeJob.stage1?.invoice_no || '',
            gateway_igm: completeJob.Stage1?.gateway_igm || completeJob.stage1?.gateway_igm || '',
            gateway_igm_date: completeJob.Stage1?.gateway_igm_date ? completeJob.Stage1.gateway_igm_date.split('T')[0] : (completeJob.stage1?.gateway_igm_date ? completeJob.stage1.gateway_igm_date.split('T')[0] : ''),
            local_igm: completeJob.Stage1?.local_igm || completeJob.stage1?.local_igm || '',
            local_igm_date: completeJob.Stage1?.local_igm_date ? completeJob.Stage1.local_igm_date.split('T')[0] : (completeJob.stage1?.local_igm_date ? completeJob.stage1.local_igm_date.split('T')[0] : ''),
            // EDI Information
            edi_job_no: '',
            edi_date: ''
          });
        }
      } else {
        console.error("Failed to fetch complete job data");
        // Fallback to original job data
        setSelectedJob(job);
        setFormData({
          hsn_code: '', 
          filing_requirement: '', 
          checklist_sent_date: '', 
          approval_date: '',
          bill_of_entry_no: '', 
          bill_of_entry_date: '', 
          ocean_freight: 0,
          original_doct_recd_date: '', 
          drn_entries: [{ drn_no: '', irn_entries: [{ irn_number: '', documents_type: '' }] }],
          invoice_no: '',
          gateway_igm: '',
          gateway_igm_date: '',
          local_igm: '',
          local_igm_date: ''
        });
      }
    } catch (error) {
      console.error("Error fetching complete job data:", error);
      // Fallback to original job data
      setSelectedJob(job);
      setFormData({
        hsn_code: '', 
        filing_requirement: '', 
        checklist_sent_date: '', 
        approval_date: '',
        bill_of_entry_no: '', 
        bill_of_entry_date: '', 
        ocean_freight: 0,
        original_doct_recd_date: '', 
        drn_entries: [{ drn_no: '', irn_entries: [{ irn_number: '', documents_type: '' }] }],
        invoice_no: '',
        gateway_igm: '',
        gateway_igm_date: '',
        local_igm: '',
        local_igm_date: ''
      });
    }
    
    setShowUpdateModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = value;
    
    if (type === 'number') {
      newValue = value === '' ? '' : parseFloat(value);
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



  const handleAdvanceStage = async (jobId) => {
    if (!confirm("Are you sure you want to advance this job to Stage 3? This will allow file uploads in Stage 3.")) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${jobId}/advance-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetStage: "stage3" })
      });

      if (res.ok) {
        const responseData = await res.json();
        console.log("Stage advancement success:", responseData);
        alert("Job successfully advanced to Stage 3!");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting stage2 data for job:", selectedJob.id);
    
    // Prepare form data for submission
    const submitData = {
      ...formData,
      drn_entries: formData.drn_entries.map(entry => ({
        ...entry,
        irn_entries: entry.irn_entries.filter(irn => 
          irn.irn_number.trim() !== '' || irn.documents_type.trim() !== ''
        )
      }))
    };
    
    console.log("Form data:", submitData);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${selectedJob.id}/stage2`, {
        method: "post",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submitData)
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
                          {job.Stage1?.consignee || job.stage1?.consignee || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.Stage1?.commodity || job.stage1?.commodity || '-'}
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
                          {job.stage2 && job.current_stage === 'stage2' && (
                            <button
                              onClick={() => handleAdvanceStage(job.id)}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              Advance to Stage 3
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
                  <div><strong>Consignee:</strong> {selectedJob.Stage1?.consignee || selectedJob.stage1?.consignee || '-'}</div>
                  <div><strong>Shipper:</strong> {selectedJob.Stage1?.shipper || selectedJob.stage1?.shipper || '-'}</div>
                  <div><strong>Commodity:</strong> {selectedJob.Stage1?.commodity || selectedJob.stage1?.commodity || '-'}</div>
                  <div><strong>Invoice No:</strong> {selectedJob.Stage1?.invoice_no || selectedJob.stage1?.invoice_no || '-'}</div>
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
                      value={formData.hsn_code || ''}
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
                    value={formData.filing_requirement || ''}
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
                      value={formData.checklist_sent_date || ''}
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
                      value={formData.approval_date || ''}
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
                      value={formData.bill_of_entry_no || ''}
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
                      value={formData.bill_of_entry_date || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.bill_of_entry_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.bill_of_entry_date && <p className="text-red-500 text-xs mt-1">{errors.bill_of_entry_date}</p>}
                  </div>
                </div>

                {/* Ocean Freight */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ocean Freight</label>
                    <input
                      type="number"
                      name="ocean_freight"
                      value={formData.ocean_freight || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.ocean_freight ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter amount"
                      step="0.01"
                      min="0"
                    />
                    {errors.ocean_freight && <p className="text-red-500 text-xs mt-1">{errors.ocean_freight}</p>}
                  </div>
                </div>

                {/* Multiple DRN Entries */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">DRN Entries</h3>
                    <button
                      type="button"
                      onClick={addDrnEntry}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      + Add DRN Entry
                    </button>
                  </div>
                  
                  {formData.drn_entries.map((entry, drnIndex) => (
                    <div key={drnIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-700">DRN Entry {drnIndex + 1}</h4>
                        {formData.drn_entries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDrnEntry(drnIndex)}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                          >
                            Remove DRN
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">DRN No.</label>
                          <input
                            type="text"
                            value={entry.drn_no || ''}
                            onChange={(e) => updateDrnEntry(drnIndex, 'drn_no', e.target.value)}
                            className={`w-full border rounded-md px-3 py-2 text-black ${
                              errors.drn_entries ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter DRN Number"
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">IRN Entries</label>
                            <button
                              type="button"
                              onClick={() => addIrnEntry(drnIndex)}
                              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            >
                              + Add IRN Entry
                            </button>
                          </div>
                          <div className="space-y-3">
                            {entry.irn_entries.map((irn, irnIndex) => (
                              <div key={irnIndex} className="border border-gray-200 rounded p-3 bg-white">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-600">IRN Entry {irnIndex + 1}</span>
                                  {entry.irn_entries.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeIrnEntry(drnIndex, irnIndex)}
                                      className="px-1 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">IRN Number</label>
                                    <input
                                      type="text"
                                      value={irn.irn_number || ''}
                                      onChange={(e) => updateIrnEntry(drnIndex, irnIndex, 'irn_number', e.target.value)}
                                      className={`w-full border rounded-md px-2 py-1 text-black text-sm ${
                                        errors.drn_entries ? 'border-red-500' : 'border-gray-300'
                                      }`}
                                      placeholder="Enter IRN Number"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Documents Type</label>
                                    <input
                                      type="text"
                                      value={irn.documents_type || ''}
                                      onChange={(e) => updateIrnEntry(drnIndex, irnIndex, 'documents_type', e.target.value)}
                                      className={`w-full border rounded-md px-2 py-1 text-black text-sm ${
                                        errors.drn_entries ? 'border-red-500' : 'border-gray-300'
                                      }`}
                                      placeholder="Enter Documents Type"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {errors.drn_entries && <p className="text-red-500 text-xs mt-1">{errors.drn_entries}</p>}
                </div>

                {/* Original Document Received Date */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Original Document Received Date</label>
                    <input
                      type="date"
                      name="original_doct_recd_date"
                      value={formData.original_doct_recd_date || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.original_doct_recd_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.original_doct_recd_date && <p className="text-red-500 text-xs mt-1">{errors.original_doct_recd_date}</p>}
                  </div>
                </div>


                {/* Invoice No */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No.</label>
                  <input
                    type="text"
                    name="invoice_no"
                    value={formData.invoice_no || ''}
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
                      value={formData.gateway_igm || ''}
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
                      value={formData.gateway_igm_date || ''}
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
                      value={formData.local_igm || ''}
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
                      value={formData.local_igm_date || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.local_igm_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.local_igm_date && <p className="text-red-500 text-xs mt-1">{errors.local_igm_date}</p>}
                  </div>
                </div>

                {/* EDI Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">EDI Job No</label>
                    <input
                      type="text"
                      name="edi_job_no"
                      value={formData.edi_job_no || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.edi_job_no ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter EDI Job Number"
                    />
                    {errors.edi_job_no && <p className="text-red-500 text-xs mt-1">{errors.edi_job_no}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">EDI Date</label>
                    <input
                      type="date"
                      name="edi_date"
                      value={formData.edi_date || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.edi_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.edi_date && <p className="text-red-500 text-xs mt-1">{errors.edi_date}</p>}
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
