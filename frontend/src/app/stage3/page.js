"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Stage3Page() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    exam_date: '',
    out_of_charge: '',
    clearance_exps: '',
    stamp_duty: '',
    custodian: '',
    offloading_charges: '',
    transport_detention: '',
    dispatch_info: '',
    // Moved from Stage 2
    ocean_freight: 0,
    edi_job_no: '',
    edi_date: '',
    original_doct_recd_date: '',
    debit_note: '',
    debit_paid_by: '',
    duty_amount: 0,
    duty_paid_by: '',
    destination_charges: 0,
    containers: [
      {
        container_no: '',
        size: '',
        vehicle_no: '',
        date_of_offloading: '',
        empty_return_date: ''
      }
    ]
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search function
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredJobs(jobs);
    } else {
      const filtered = jobs.filter(job => 
        job.job_no.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredJobs(filtered);
    }
  };

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
      setUserRole(user.role || 'stage3_employee');
      setIsAdmin(user.is_admin || false);
    }
    fetchJobs();
  }, []);

  // Validation functions
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'exam_date':
        if (value && new Date(value) > new Date()) error = 'Exam date cannot be in the future';
        break;
      case 'out_of_charge':
        if (value && new Date(value) > new Date()) error = 'Out of charge date cannot be in the future';
        break;
      case 'clearance_exps':
        if (value < 0) error = 'Clearance expenses cannot be negative';
        else if (value > 999999.99) error = 'Clearance expenses cannot exceed 999,999.99';
        break;
      case 'stamp_duty':
        if (value < 0) error = 'Stamp duty cannot be negative';
        else if (value > 999999.99) error = 'Stamp duty cannot exceed 999,999.99';
        break;
      case 'custodian':
        if (value && value.length < 2) error = 'Custodian must be at least 2 characters';
        break;
      case 'offloading_charges':
        if (value < 0) error = 'Offloading charges cannot be negative';
        else if (value > 999999.99) error = 'Offloading charges cannot exceed 999,999.99';
        break;
      case 'transport_detention':
        if (value < 0) error = 'Transport detention cannot be negative';
        else if (value > 999999.99) error = 'Transport detention cannot exceed 999,999.99';
        break;
      case 'dispatch_info':
        if (value && value.length < 3) error = 'Dispatch info must be at least 3 characters';
        break;
      case 'ocean_freight':
        if (value && value !== '') {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) error = 'Ocean freight must be a valid number';
          else if (numValue < 0) error = 'Ocean freight cannot be negative';
          else if (numValue > 999999.99) error = 'Ocean freight cannot exceed 999,999.99';
        }
        break;
      case 'edi_job_no':
        if (value && value.length < 2) error = 'EDI Job No must be at least 2 characters';
        break;
      case 'edi_date':
        if (value && new Date(value) > new Date()) error = 'EDI date cannot be in the future';
        break;
      case 'original_doct_recd_date':
        if (value && new Date(value) > new Date()) error = 'Original documents received date cannot be in the future';
        break;
      case 'debit_note':
        if (value && value.length < 2) error = 'Debit note must be at least 2 characters';
        break;
      case 'debit_paid_by':
        if (value && value.length < 2) error = 'Debit paid by must be at least 2 characters';
        break;
      case 'duty_amount':
        // No validation - user can enter any amount
        break;
      case 'duty_paid_by':
        if (value && value.length < 2) error = 'Duty paid by must be at least 2 characters';
        break;
      case 'destination_charges':
        if (value && value !== '') {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) error = 'Destination charges must be a valid number';
          else if (numValue < 0) error = 'Destination charges cannot be negative';
          else if (numValue > 999999.99) error = 'Destination charges cannot exceed 999,999.99';
        }
        break;
      default:
        break;
    }
    
    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    if (!formData.exam_date) {
      newErrors.exam_date = 'Exam date is required';
    }
    if (!formData.out_of_charge) {
      newErrors.out_of_charge = 'Out of charge date is required';
    }
    if (!formData.custodian.trim()) {
      newErrors.custodian = 'Custodian is required';
    }
    
    // Validate all other fields
    Object.keys(formData).forEach(field => {
      if (formData[field] !== '' && formData[field] !== 0) {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      }
    });
    
    // Validate containers
    if (formData.containers && formData.containers.length > 0) {
      formData.containers.forEach((container, index) => {
        if (container.container_no && container.container_no.length < 2) {
          newErrors[`container_${index}_no`] = 'Container number must be at least 2 characters';
        }
        if (container.size && !['20', '40', 'LCL'].includes(container.size)) {
          newErrors[`container_${index}_size`] = 'Container size must be 20, 40, or LCL';
        }
        if (container.vehicle_no && container.vehicle_no.length < 2) {
          newErrors[`container_${index}_vehicle`] = 'Vehicle number must be at least 2 characters';
        }
        if (container.date_of_offloading && new Date(container.date_of_offloading) > new Date()) {
          newErrors[`container_${index}_offloading`] = 'Date of offloading cannot be in the future';
        }
        if (container.empty_return_date && new Date(container.empty_return_date) > new Date()) {
          newErrors[`container_${index}_return`] = 'Empty return date cannot be in the future';
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleContainerChange = (index, field, value) => {
    const newContainers = [...formData.containers];
    newContainers[index] = {
      ...newContainers[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      containers: newContainers
    }));
    
    // Clear container-specific errors
    if (errors[`container_${index}_${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`container_${index}_${field}`]: ''
      }));
    }
  };

  const addContainer = () => {
    setFormData(prev => ({
      ...prev,
      containers: [
        ...prev.containers,
        {
          container_no: '',
          size: '',
          vehicle_no: '',
          date_of_offloading: '',
          empty_return_date: ''
        }
      ]
    }));
  };

  const removeContainer = (index) => {
    if (formData.containers.length > 1) {
      setFormData(prev => ({
        ...prev,
        containers: prev.containers.filter((_, i) => i !== index)
      }));
    }
  };

  async function fetchJobs() {
    try {
      console.log("Fetching jobs for stage3 employee...");
      
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
        const jobsArray = Array.isArray(data) ? data : [];
        setJobs(jobsArray);
        setFilteredJobs(jobsArray);
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
        console.log("Complete job data for Stage 3:", completeJob);
        console.log("Stage1 data:", completeJob.stage1);
        console.log("Stage1 data (capital):", completeJob.Stage1);
        console.log("Stage1Containers data (capital):", completeJob.Stage1Containers);
        console.log("Container field in stage1:", completeJob.stage1?.container_no);
        console.log("Container field in Stage1:", completeJob.Stage1?.container_no);
        console.log("Size field in stage1:", completeJob.stage1?.container_size);
        console.log("Size field in Stage1:", completeJob.Stage1?.container_size);
        setSelectedJob(completeJob);
        
        // Pre-fill form with existing stage3 data if available
        const stage3Data = completeJob.stage3 || completeJob.Stage3;
        if (stage3Data) {
          setFormData({
            exam_date: stage3Data.exam_date ? stage3Data.exam_date.split('T')[0] : '',
            out_of_charge: stage3Data.out_of_charge ? stage3Data.out_of_charge.split('T')[0] : '',
            clearance_exps: stage3Data.clearance_exps || '',
            stamp_duty: stage3Data.stamp_duty || '',
            custodian: stage3Data.custodian || '',
            offloading_charges: stage3Data.offloading_charges || '',
            transport_detention: stage3Data.transport_detention || '',
            dispatch_info: stage3Data.dispatch_info || '',
            // Moved from Stage 2
            ocean_freight: stage3Data.ocean_freight || 0,
            edi_job_no: stage3Data.edi_job_no || '',
            edi_date: stage3Data.edi_date ? stage3Data.edi_date.split('T')[0] : '',
            original_doct_recd_date: stage3Data.original_doct_recd_date ? stage3Data.original_doct_recd_date.split('T')[0] : '',
            debit_note: stage3Data.debit_note || '',
            debit_paid_by: stage3Data.debit_paid_by || '',
            duty_amount: stage3Data.duty_amount || 0,
            duty_paid_by: stage3Data.duty_paid_by || '',
            destination_charges: stage3Data.destination_charges || 0,
            containers: stage3Data.containers && stage3Data.containers.length > 0 
              ? stage3Data.containers 
              : [{
                  container_no: '',
                  size: '',
                  vehicle_no: '',
                  date_of_offloading: '',
                  empty_return_date: ''
                }]
          });
        } else {
          // Reset form with empty values
          setFormData({
            exam_date: '',
            out_of_charge: '',
            clearance_exps: '',
            stamp_duty: '',
            custodian: '',
            offloading_charges: '',
            transport_detention: '',
            dispatch_info: '',
            // Moved from Stage 2
            ocean_freight: 0,
            edi_job_no: '',
            edi_date: '',
            original_doct_recd_date: '',
            debit_note: '',
            debit_paid_by: '',
            duty_amount: 0,
            duty_paid_by: '',
            destination_charges: 0,
            containers: [{
              container_no: '',
              size: '',
              vehicle_no: '',
              date_of_offloading: '',
              empty_return_date: ''
            }]
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
    console.log("Submitting stage3 data for job:", selectedJob.id);
    console.log("Form data:", formData);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${selectedJob.id}/stage3`, {
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
        alert("Stage 3 data updated successfully!");
      } else {
        const errorData = await res.text();
        console.error("Error response:", errorData);
        alert("Error updating data: " + errorData);
      }
    } catch (err) {
      console.error("Error updating stage 3 data:", err);
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
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stage 3: Clearance & Logistics</h1>
              <p className="text-gray-600 mt-2">Manage clearance process and logistics operations</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Job No..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-gray-900"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
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
                    filteredJobs.map((job) => (
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
                            job.stage3 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {job.stage3 ? 'Data Entered' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleJobSelect(job)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            {job.stage3 ? 'Update' : 'Enter'} Data
                          </button>
                          {job.stage3 && job.current_stage === 'stage3' && (
                            <button
                              onClick={() => handleAdvanceStage(job.id, 'stage4')}
                              className="text-orange-600 hover:text-orange-900 mr-4"
                            >
                              Advance to Stage 4
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
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Stage 3: Clearance & Logistics</h2>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div><strong>Consignee:</strong> {selectedJob.stage1?.consignee || selectedJob.Stage1?.consignee || '-'}</div>
                  <div><strong>Container:</strong> {
                    (selectedJob.Stage1Containers && selectedJob.Stage1Containers.length > 0) 
                      ? selectedJob.Stage1Containers.map(container => container.container_no).join(', ')
                      : selectedJob.stage1?.container_no || selectedJob.Stage1?.container_no || '-'
                  }</div>
                  <div><strong>Size:</strong> {
                    (selectedJob.Stage1Containers && selectedJob.Stage1Containers.length > 0) 
                      ? selectedJob.Stage1Containers.map(container => container.container_size).join(', ')
                      : selectedJob.stage1?.container_size || selectedJob.Stage1?.container_size || '-'
                  }</div>
                  <div><strong>Bill of Entry:</strong> {selectedJob.stage2?.bill_of_entry_no || selectedJob.Stage2?.bill_of_entry_no || '-'}</div>
                  <div><strong>HSN Code:</strong> {selectedJob.stage2?.hsn_code || selectedJob.Stage2?.hsn_code || '-'}</div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Clearance Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date</label>
                                          <input
                        type="date"
                        name="exam_date"
                        value={formData.exam_date || ''}
                        onChange={handleInputChange}
                        className={`w-full border rounded-md px-3 py-2 text-black ${
                          errors.exam_date ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    {errors.exam_date && <p className="text-red-500 text-xs mt-1">{errors.exam_date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Out of Charge Date</label>
                                          <input
                        type="date"
                        name="out_of_charge"
                        value={formData.out_of_charge || ''}
                        onChange={handleInputChange}
                        className={`w-full border rounded-md px-3 py-2 text-black ${
                          errors.out_of_charge ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    {errors.out_of_charge && <p className="text-red-500 text-xs mt-1">{errors.out_of_charge}</p>}
                  </div>
                </div>

                {/* Financial Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clearance Expenses</label>
                    <input
                      type="number"
                      name="clearance_exps"
                      value={formData.clearance_exps || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.clearance_exps ? 'border-red-500' : 'border-gray-300'
                      }`}
                      step="0.01"
                      min="0"
                    />
                    {errors.clearance_exps && <p className="text-red-500 text-xs mt-1">{errors.clearance_exps}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stamp Duty</label>
                    <input
                      type="number"
                      name="stamp_duty"
                      value={formData.stamp_duty || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.stamp_duty ? 'border-red-500' : 'border-gray-300'
                      }`}
                      step="0.01"
                      min="0"
                    />
                    {errors.stamp_duty && <p className="text-red-500 text-xs mt-1">{errors.stamp_duty}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custodian</label>
                    <input
                      type="text"
                      name="custodian"
                      value={formData.custodian || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.custodian ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.custodian && <p className="text-red-500 text-xs mt-1">{errors.custodian}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Offloading Charges</label>
                    <input
                      type="number"
                      name="offloading_charges"
                      value={formData.offloading_charges || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.offloading_charges ? 'border-red-500' : 'border-gray-300'
                      }`}
                      step="0.01"
                      min="0"
                    />
                    {errors.offloading_charges && <p className="text-red-500 text-xs mt-1">{errors.offloading_charges}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transport Detention</label>
                    <input
                      type="number"
                      name="transport_detention"
                      value={formData.transport_detention || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.transport_detention ? 'border-red-500' : 'border-gray-300'
                      }`}
                      step="0.01"
                      min="0"
                    />
                    {errors.transport_detention && <p className="text-red-500 text-xs mt-1">{errors.transport_detention}</p>}
                  </div>
                </div>

                {/* Dispatch Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Information</label>
                  <textarea
                    name="dispatch_info"
                    value={formData.dispatch_info || ''}
                    onChange={handleInputChange}
                    className={`w-full border rounded-md px-3 py-2 text-black ${
                      errors.dispatch_info ? 'border-red-500' : 'border-gray-300'
                    }`}
                    rows="3"
                    placeholder="Enter dispatch details, delivery instructions, etc."
                  />
                  {errors.dispatch_info && <p className="text-red-500 text-xs mt-1">{errors.dispatch_info}</p>}
                </div>

                {/* Ocean Freight */}
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

                {/* Original Document Received Date */}
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

                {/* Moved from Stage 2 - Debit Note */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Debit Note</label>
                    <input
                      type="text"
                      name="debit_note"
                      value={formData.debit_note || ''}
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
                      value={formData.debit_paid_by || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.debit_paid_by ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.debit_paid_by && <p className="text-red-500 text-xs mt-1">{errors.debit_paid_by}</p>}
                  </div>
                </div>

                {/* Moved from Stage 2 - Duty Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duty Amount</label>
                    <input
                      type="text"
                      name="duty_amount"
                      value={formData.duty_amount || ''}
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
                      value={formData.duty_paid_by || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.duty_paid_by ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.duty_paid_by && <p className="text-red-500 text-xs mt-1">{errors.duty_paid_by}</p>}
                  </div>
                </div>

                {/* Moved from Stage 2 - Destination Charges */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination Charges</label>
                    <input
                      type="text"
                      name="destination_charges"
                      value={formData.destination_charges || ''}
                      onChange={handleInputChange}
                      className={`w-full border rounded-md px-3 py-2 text-black ${
                        errors.destination_charges ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter amount"
                    />
                    {errors.destination_charges && <p className="text-red-500 text-xs mt-1">{errors.destination_charges}</p>}
                  </div>
                </div>

                {/* Container Details */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Container Details</h3>
                    <button
                      type="button"
                      onClick={addContainer}
                      className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                    >
                      + Add Container
                    </button>
                  </div>

                  {formData.containers.map((container, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">Container #{index + 1}</h4>
                        {formData.containers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeContainer(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Container No.</label>
                          <input
                            type="text"
                            value={container.container_no || ''}
                            onChange={(e) => handleContainerChange(index, 'container_no', e.target.value)}
                            className={`w-full border rounded-md px-3 py-2 text-black ${
                              errors[`container_${index}_no`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors[`container_${index}_no`] && <p className="text-red-500 text-xs mt-1">{errors[`container_${index}_no`]}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                          <select
                            value={container.size || ''}
                            onChange={(e) => handleContainerChange(index, 'size', e.target.value)}
                            className={`w-full border rounded-md px-3 py-2 text-black ${
                              errors[`container_${index}_size`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="20">20&apos;</option>
                            <option value="40">40&apos;</option>
                            <option value="LCL">LCL</option>
                          </select>
                          {errors[`container_${index}_size`] && <p className="text-red-500 text-xs mt-1">{errors[`container_${index}_size`]}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No.</label>
                          <input
                            type="text"
                            value={container.vehicle_no || ''}
                            onChange={(e) => handleContainerChange(index, 'vehicle_no', e.target.value)}
                            className={`w-full border rounded-md px-3 py-2 text-black ${
                              errors[`container_${index}_vehicle`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors[`container_${index}_vehicle`] && <p className="text-red-500 text-xs mt-1">{errors[`container_${index}_vehicle`]}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Offloading</label>
                                                     <input
                             type="date"
                             value={container.date_of_offloading || ''}
                             onChange={(e) => handleContainerChange(index, 'date_of_offloading', e.target.value)}
                             className={`w-full border rounded-md px-3 py-2 text-black ${
                               errors[`container_${index}_offloading`] ? 'border-red-500' : 'border-gray-300'
                             }`}
                           />
                          {errors[`container_${index}_offloading`] && <p className="text-red-500 text-xs mt-1">{errors[`container_${index}_offloading`]}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Empty Return Date</label>
                                                     <input
                             type="date"
                             value={container.empty_return_date || ''}
                             onChange={(e) => handleContainerChange(index, 'empty_return_date', e.target.value)}
                             className={`w-full border rounded-md px-3 py-2 text-black ${
                               errors[`container_${index}_return`] ? 'border-red-500' : 'border-gray-300'
                             }`}
                           />
                          {errors[`container_${index}_return`] && <p className="text-red-500 text-xs mt-1">{errors[`container_${index}_return`]}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
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
                       {isSubmitting ? 'Saving...' : 'Save Clearance Data'}
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