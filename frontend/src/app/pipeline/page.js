"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function PipelinePage() {
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    job_no: '',
    job_date: '',
    edi_job_no: '',
    edi_date: '',
    consignee: '',
    shipper: '',
    port_of_discharge: '',
    final_place_of_delivery: '',
    port_of_loading: '',
    country_of_shipment: '',
    hbl_no: '',
    hbl_date: '',
    mbl_no: '',
    mbl_date: '',
    shipping_line: '',
    forwarder: '',
    weight: 0,
    packages: 0,
    invoice_no: '',
    invoice_date: '',
    gateway_igm: '',
    gateway_igm_date: '',
    local_igm: '',
    local_igm_date: '',
    commodity: '',
    eta: '',
    current_status: '',
    container_no: '',
    container_size: '20',
    date_of_arrival: '',
    assigned_to_stage2: 0,
    assigned_to_stage3: 0,
    customer_id: 0,
    notification_email: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Get user info from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.log("No user data found - redirecting to login");
        window.location.href = "/login";
        return;
      }
      
      const user = JSON.parse(userData);
      console.log("Current user for pipeline:", user);

      let jobsRes, usersRes;

      if (user.is_admin || user.role === 'subadmin') {
        // Admin and subadmin see all jobs and users
        console.log("Admin/Subadmin user - fetching all jobs and users");
        [jobsRes, usersRes] = await Promise.all([
          fetch(process.env.NEXT_PUBLIC_API_URL + "/api/pipeline/jobs", { credentials: "include" }),
          fetch(process.env.NEXT_PUBLIC_API_URL + "/api/users", { credentials: "include" })
        ]);
      } else {
        // Employee sees only their assigned jobs (no users list needed)
        console.log("Employee user - fetching assigned jobs only");
        jobsRes = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/pipeline/myjobs", { credentials: "include" });
        usersRes = { ok: true, status: 200 }; // Mock successful response for users
      }

      if (jobsRes.status === 401) {
        console.log("Session expired - redirecting to login");
        window.location.href = "/login";
        return;
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        console.log("Pipeline received jobs:", jobsData);
        setJobs(Array.isArray(jobsData) ? jobsData : []);
        
        // Only fetch users data if admin/subadmin and users request was successful
        if ((user.is_admin || user.role === 'subadmin') && usersRes.ok) {
          const usersData = await usersRes.json();
          console.log("Pipeline received users:", usersData);
          setUsers(Array.isArray(usersData) ? usersData : []);
        } else {
          setUsers([]); // Empty users list for employees
        }
      } else {
        console.error("Error fetching jobs data - status:", jobsRes.status);
        setJobs([]);
        setUsers([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setJobs([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Fields that should be numbers
    const numberFields = ['weight', 'packages', 'assigned_to_stage2', 'assigned_to_stage3', 'customer_id'];
    
    setFormData(prev => ({
      ...prev,
      [name]: numberFields.includes(name) ? (parseInt(value) || 0) : value
    }));
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      console.log("Sending form data:", formData);
      
      // Create a simplified request with only required fields for testing
      const testData = {
        job_no: formData.job_no,
        job_date: formData.job_date || "",
        edi_job_no: formData.edi_job_no || "",
        edi_date: formData.edi_date || "",
        consignee: formData.consignee || "",
        shipper: formData.shipper || "",
        port_of_discharge: formData.port_of_discharge || "",
        final_place_of_delivery: formData.final_place_of_delivery || "",
        port_of_loading: formData.port_of_loading || "",
        country_of_shipment: formData.country_of_shipment || "",
        hbl_no: formData.hbl_no || "",
        hbl_date: formData.hbl_date || "",
        mbl_no: formData.mbl_no || "",
        mbl_date: formData.mbl_date || "",
        shipping_line: formData.shipping_line || "",
        forwarder: formData.forwarder || "",
        weight: formData.weight || 0,
        packages: formData.packages || 0,
        invoice_no: formData.invoice_no || "",
        invoice_date: formData.invoice_date || "",
        gateway_igm: formData.gateway_igm || "",
        gateway_igm_date: formData.gateway_igm_date || "",
        local_igm: formData.local_igm || "",
        local_igm_date: formData.local_igm_date || "",
        commodity: formData.commodity || "",
        eta: formData.eta || "",
        current_status: formData.current_status || "",
        container_no: formData.container_no || "",
        container_size: formData.container_size || "20",
        date_of_arrival: formData.date_of_arrival || "",
        assigned_to_stage2: formData.assigned_to_stage2 || 0,
        assigned_to_stage3: formData.assigned_to_stage3 || 0,
        customer_id: formData.customer_id || 0,
        notification_email: formData.notification_email || ""
      };
      
      const jsonBody = JSON.stringify(testData);
      console.log("JSON body:", jsonBody);
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/pipeline/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: jsonBody
      });

      if (res.ok) {
        setShowCreateModal(false);
        setFormData({
          job_no: '', job_date: '', edi_job_no: '', edi_date: '', consignee: '', shipper: '',
          port_of_discharge: '', final_place_of_delivery: '', port_of_loading: '', country_of_shipment: '',
          hbl_no: '', hbl_date: '', mbl_no: '', mbl_date: '', shipping_line: '', forwarder: '',
          weight: 0, packages: 0, invoice_no: '', invoice_date: '', gateway_igm: '', gateway_igm_date: '',
          local_igm: '', local_igm_date: '', commodity: '', eta: '', current_status: '',
          container_no: '', container_size: '20', date_of_arrival: '', assigned_to_stage2: 0, assigned_to_stage3: 0, customer_id: 0, notification_email: ''
        });
        fetchData();
      } else {
        const errorData = await res.text();
        console.error("Backend error response:", errorData);
        alert("Error creating job: " + errorData);
      }
    } catch (err) {
      console.error("Error creating job:", err);
      alert("Error creating job");
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

  const getStageName = (stage) => {
    switch (stage) {
      case 'stage1': return 'Initial Setup';
      case 'stage2': return 'Customs & Docs';
      case 'stage3': return 'Clearance & Logistics';
      case 'stage4': return 'Billing';
      case 'completed': return 'Completed';
      default: return stage;
    }
  };

  const stage2Employees = users.filter(u => u.role === 'stage2_employee') || [];
  const stage3Employees = users.filter(u => u.role === 'stage3_employee') || [];
  const customers = users.filter(u => u.role === 'customer') || [];

  const [userRole, setUserRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubadmin, setIsSubadmin] = useState(false);

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || 'stage1_employee');
      setIsAdmin(user.is_admin || false);
      setIsSubadmin(user.role === 'subadmin');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole={userRole} isAdmin={isAdmin} isSubadmin={isSubadmin} />
      
      <div className="flex-1 ml-64">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {(isAdmin || isSubadmin) ? 'Pipeline Management' : 'My Assigned Jobs'}
              </h1>
              <p className="text-gray-600 mt-1">
                {(isAdmin || isSubadmin)
                  ? 'Manage import/export pipeline jobs' 
                  : 'View and manage your assigned pipeline jobs'
                }
              </p>
            </div>
            {(isAdmin || isSubadmin) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <span>+</span>
                Create New Job
              </button>
            )}
          </div>
        </div>

        {/* Pipeline Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{jobs.filter(j => j.current_stage === 'stage1').length}</div>
            <div className="text-sm text-gray-600">Initial Setup</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{jobs.filter(j => j.current_stage === 'stage2').length}</div>
            <div className="text-sm text-gray-600">Customs & Docs</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{jobs.filter(j => j.current_stage === 'stage3').length}</div>
            <div className="text-sm text-gray-600">Clearance</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{jobs.filter(j => j.current_stage === 'stage4').length}</div>
            <div className="text-sm text-gray-600">Billing</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{jobs.filter(j => j.current_stage === 'completed').length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {(isAdmin || isSubadmin) ? 'All Pipeline Jobs' : 'My Assigned Jobs'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consignee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipper</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {job.job_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(job.current_stage)}`}>
                        {getStageName(job.current_stage)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.stage1?.consignee || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.stage1?.shipper || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => window.location.href = `/pipeline/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Pipeline Job</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job No. *</label>
                    <input
                      type="text"
                      name="job_no"
                      value={formData.job_no}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Date</label>
                    <input
                      type="date"
                      name="job_date"
                      value={formData.job_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* EDI Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">EDI Job No.</label>
                    <input
                      type="text"
                      name="edi_job_no"
                      value={formData.edi_job_no}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">EDI Date</label>
                    <input
                      type="date"
                      name="edi_date"
                      value={formData.edi_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consignee</label>
                    <textarea
                      name="consignee"
                      value={formData.consignee}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shipper</label>
                    <textarea
                      name="shipper"
                      value={formData.shipper}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      rows="3"
                    />
                  </div>
                </div>

                {/* Ports */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Port of Discharge</label>
                    <input
                      type="text"
                      name="port_of_discharge"
                      value={formData.port_of_discharge}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Final Place of Delivery</label>
                    <input
                      type="text"
                      name="final_place_of_delivery"
                      value={formData.final_place_of_delivery}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Port of Loading</label>
                    <input
                      type="text"
                      name="port_of_loading"
                      value={formData.port_of_loading}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country of Shipment</label>
                    <input
                      type="text"
                      name="country_of_shipment"
                      value={formData.country_of_shipment}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* Bill of Lading */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HBL No.</label>
                    <input
                      type="text"
                      name="hbl_no"
                      value={formData.hbl_no}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HBL Date</label>
                    <input
                      type="date"
                      name="hbl_date"
                      value={formData.hbl_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MBL No.</label>
                    <input
                      type="text"
                      name="mbl_no"
                      value={formData.mbl_no}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MBL Date</label>
                    <input
                      type="date"
                      name="mbl_date"
                      value={formData.mbl_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Line</label>
                    <input
                      type="text"
                      name="shipping_line"
                      value={formData.shipping_line}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Forwarder</label>
                    <input
                      type="text"
                      name="forwarder"
                      value={formData.forwarder}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py- text-black"
                    />
                  </div>
                </div>

                {/* Cargo Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (KG)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Packages</label>
                    <input
                      type="number"
                      name="packages"
                      value={formData.packages}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No.</label>
                    <input
                      type="text"
                      name="invoice_no"
                      value={formData.invoice_no}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                    <input
                      type="date"
                      name="invoice_date"
                      value={formData.invoice_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* IGM Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gateway IGM</label>
                    <input
                      type="text"
                      name="gateway_igm"
                      value={formData.gateway_igm}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />      
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gateway IGM Date</label>
                    <input
                      type="date"
                      name="gateway_igm_date"
                      value={formData.gateway_igm_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local IGM</label>
                    <input
                      type="text"
                      name="local_igm"
                      value={formData.local_igm}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local IGM Date</label>
                    <input
                      type="date"
                      name="local_igm_date"
                      value={formData.local_igm_date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* Additional Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commodity</label>
                  <textarea
                    name="commodity"
                    value={formData.commodity}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    rows="2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ETA</label>
                    <input
                      type="datetime-local"
                      name="eta"
                      value={formData.eta}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                    <input
                      type="text"
                      name="current_status"
                      value={formData.current_status}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* Container Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Container No.</label>
                    <input
                      type="text"
                      name="container_no"
                      value={formData.container_no}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Container Size</label>
                    <select
                      name="container_size"
                      value={formData.container_size}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black" 
                    >
                      <option value="20">20'</option>
                      <option value="40">40'</option>
                      <option value="LCL">LCL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Arrival</label>
                    <input
                      type="date"
                      name="date_of_arrival"
                      value={formData.date_of_arrival}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                  </div>
                </div>

                {/* Assignments */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Stage 2 Employee</label>
                    <select
                      name="assigned_to_stage2"
                      value={formData.assigned_to_stage2}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    >
                      <option value={0}>Select Employee</option>
                      {stage2Employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.username} - {emp.designation}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Stage 3 Employee</label>
                    <select
                      name="assigned_to_stage3"
                      value={formData.assigned_to_stage3}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    >
                      <option value={0}>Select Employee</option>
                      {stage3Employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.username} - {emp.designation}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Customer</label>
                    <select
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    >
                      <option value={0}>Select Customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.username}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notification Email */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notification Email <span className="text-gray-500">(Optional - for stage completion alerts)</span>
                    </label>
                    <input
                      type="email"
                      name="notification_email"
                      value={formData.notification_email}
                      onChange={handleInputChange}
                      placeholder="Enter email address to receive notifications"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use default admin email. This email will receive notifications when stages are completed.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Job
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
} 