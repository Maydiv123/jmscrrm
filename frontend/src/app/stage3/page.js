"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Stage3Page() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    exam_date: '',
    out_of_charge: '',
    clearance_exps: 0,
    stamp_duty: 0,
    custodian: '',
    offloading_charges: 0,
    transport_detention: 0,
    dispatch_info: '',
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
    // Pre-fill form with existing stage3 data if available
    if (job.stage3) {
      setFormData({
        exam_date: job.stage3.exam_date ? job.stage3.exam_date.split('T')[0] : '',
        out_of_charge: job.stage3.out_of_charge ? job.stage3.out_of_charge.split('T')[0] : '',
        clearance_exps: job.stage3.clearance_exps || 0,
        stamp_duty: job.stage3.stamp_duty || 0,
        custodian: job.stage3.custodian || '',
        offloading_charges: job.stage3.offloading_charges || 0,
        transport_detention: job.stage3.transport_detention || 0,
        dispatch_info: job.stage3.dispatch_info || '',
        containers: job.stage3.containers && job.stage3.containers.length > 0 ? 
          job.stage3.containers.map(container => ({
            container_no: container.container_no || '',
            size: container.size || '',
            vehicle_no: container.vehicle_no || '',
            date_of_offloading: container.date_of_offloading ? container.date_of_offloading.split('T')[0] : '',
            empty_return_date: container.empty_return_date ? container.empty_return_date.split('T')[0] : ''
          })) : [
            {
              container_no: '',
              size: '',
              vehicle_no: '',
              date_of_offloading: '',
              empty_return_date: ''
            }
          ]
      });
    } else {
      // Reset form for new entry
      setFormData({
        exam_date: '',
        out_of_charge: '',
        clearance_exps: 0,
        stamp_duty: 0,
        custodian: '',
        offloading_charges: 0,
        transport_detention: 0,
        dispatch_info: '',
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
    }
    setShowUpdateModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const numberFields = ['clearance_exps', 'stamp_duty', 'offloading_charges', 'transport_detention'];
    
    setFormData(prev => ({
      ...prev,
      [name]: numberFields.includes(name) ? (parseFloat(value) || 0) : value
    }));
  };

  const handleContainerChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      containers: prev.containers.map((container, i) => 
        i === index ? { ...container, [field]: value } : container
      )
    }));
  };

  const addContainer = () => {
    setFormData(prev => ({
      ...prev,
      containers: [...prev.containers, {
        container_no: '',
        size: '',
        vehicle_no: '',
        date_of_offloading: '',
        empty_return_date: ''
      }]
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

  const fillTestData = () => {
    const testData = {
      exam_date: '2024-01-25',
      out_of_charge: '2024-01-28',
      clearance_exps: 15000.00,
      stamp_duty: 5000.00,
      custodian: 'ABC Logistics Pvt Ltd',
      offloading_charges: 8000.00,
      transport_detention: 3000.00,
      dispatch_info: 'Container dispatched to final destination via road transport',
      containers: [
        {
          container_no: 'ABCD1234567',
          size: '40',
          vehicle_no: 'MH12AB1234',
          date_of_offloading: '2024-01-26',
          empty_return_date: '2024-01-30'
        },
        {
          container_no: 'EFGH7890123',
          size: '20',
          vehicle_no: 'MH12CD5678',
          date_of_offloading: '2024-01-27',
          empty_return_date: '2024-01-31'
        }
      ]
    };
    setFormData(testData);
    alert('Test data filled! Please review and submit.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    console.log("Submitting stage3 data for job:", selectedJob.id);
    console.log("Form data:", formData);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${selectedJob.id}/stage3`, {
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
        alert("Stage 3 data updated successfully!");
      } else {
        const errorData = await res.text();
        console.error("Error response:", errorData);
        alert("Error updating data: " + errorData);
      }
    } catch (err) {
      console.error("Error updating stage 3 data:", err);
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
            <h1 className="text-3xl font-bold text-gray-900">Stage 3: Clearance & Logistics</h1>
            <p className="text-gray-600 mt-2">Manage clearance process and logistics operations</p>
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
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Job Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Job Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div><strong>Consignee:</strong> {selectedJob.stage1?.consignee || '-'}</div>
                  <div><strong>Container:</strong> {selectedJob.stage1?.container_no || '-'}</div>
                  <div><strong>Size:</strong> {selectedJob.stage1?.container_size || '-'}</div>
                  <div><strong>Bill of Entry:</strong> {selectedJob.stage2?.bill_of_entry_no || '-'}</div>
                  <div><strong>HSN Code:</strong> {selectedJob.stage2?.hsn_code || '-'}</div>
                  <div><strong>Duty Amount:</strong> ₹{selectedJob.stage2?.duty_amount || 0}</div>
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
                      value={formData.exam_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Out of Charge Date</label>
                    <input
                      type="date"
                      name="out_of_charge"
                      value={formData.out_of_charge}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* Financial Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clearance Expenses</label>
                    <input
                      type="number"
                      name="clearance_exps"
                      value={formData.clearance_exps}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stamp Duty</label>
                    <input
                      type="number"
                      name="stamp_duty"
                      value={formData.stamp_duty}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custodian</label>
                    <input
                      type="text"
                      name="custodian"
                      value={formData.custodian}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Offloading Charges</label>
                    <input
                      type="number"
                      name="offloading_charges"
                      value={formData.offloading_charges}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transport/Detention</label>
                    <input
                      type="number"
                      name="transport_detention"
                      value={formData.transport_detention}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Dispatch Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Information</label>
                  <textarea
                    name="dispatch_info"
                    value={formData.dispatch_info}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    rows="3"
                    placeholder="Enter dispatch details, delivery instructions, etc."
                  />
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
                            value={container.container_no}
                            onChange={(e) => handleContainerChange(index, 'container_no', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                          <select
                            value={container.size}
                            onChange={(e) => handleContainerChange(index, 'size', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                          >
                            <option value="20">20'</option>
                            <option value="40">40'</option>
                            <option value="LCL">LCL</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No.</label>
                          <input
                            type="text"
                            value={container.vehicle_no}
                            onChange={(e) => handleContainerChange(index, 'vehicle_no', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Offloading</label>
                          <input
                            type="date"
                            value={container.date_of_offloading}
                            onChange={(e) => handleContainerChange(index, 'date_of_offloading', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Empty Return Date</label>
                          <input
                            type="date"
                            value={container.empty_return_date}
                            onChange={(e) => handleContainerChange(index, 'empty_return_date', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
                      Save Clearance Data
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