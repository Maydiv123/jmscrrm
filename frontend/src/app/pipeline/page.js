"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Sidebar from "../components/Sidebar";

export default function PipelinePage() {
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
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
    containers: [
      {
        container_no: '',
        container_size: '20',
        date_of_arrival: ''
      }
    ],
    notification_email: ''
  });
  const [errors, setErrors] = useState({});
  const [consignees, setConsignees] = useState([]);
  const [lastConsigneeUpdate, setLastConsigneeUpdate] = useState(null);

  useEffect(() => {
    fetchData();
    fetchConsignees();
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

      // Check if API URL is available
      if (!process.env.NEXT_PUBLIC_API_URL) {
        console.log("API URL not configured, using sample data");
        setJobs([
          {
            id: 1,
            job_no: 'JOB001',
            current_stage: 'stage1',
            status: 'active',
            created_at: new Date().toISOString(),
            stage1: {
              consignee: 'ABC Trading Co.',
              shipper: 'Global Shipping Ltd.'
            }
          },
          {
            id: 2,
            job_no: 'JOB002',
            current_stage: 'stage2',
            status: 'active',
            created_at: new Date().toISOString(),
            stage1: {
              consignee: 'XYZ Logistics Ltd.',
              shipper: 'Ocean Freight Solutions'
            }
          }
        ]);
        setUsers([]);
        setLoading(false);
        return;
      }

      let jobsRes, usersRes;

      if (user.is_admin || user.role === 'subadmin') {
        // Admin and subadmin see all jobs and users
        console.log("Admin/Subadmin user - fetching all jobs and users");
        try {
          [jobsRes, usersRes] = await Promise.all([
            fetch(process.env.NEXT_PUBLIC_API_URL + "/api/pipeline/jobs", { credentials: "include" }),
            fetch(process.env.NEXT_PUBLIC_API_URL + "/api/users", { credentials: "include" })
          ]);
        } catch (err) {
          console.log("Network error, using sample data");
          setJobs([
            {
              id: 1,
              job_no: 'JOB001',
              current_stage: 'stage1',
              status: 'active',
              created_at: new Date().toISOString(),
              stage1: {
                consignee: 'ABC Trading Co.',
                shipper: 'Global Shipping Ltd.'
              }
            },
            {
              id: 2,
              job_no: 'JOB002',
              current_stage: 'stage2',
              status: 'active',
              created_at: new Date().toISOString(),
              stage1: {
                consignee: 'XYZ Logistics Ltd.',
                shipper: 'Ocean Freight Solutions'
              }
            }
          ]);
          setUsers([]);
          setLoading(false);
          return;
        }
      } else {
        // Employee sees only their stage jobs
        console.log("Employee user - fetching stage jobs only");
        try {
          jobsRes = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/pipeline/myjobs", { credentials: "include" });
          usersRes = { ok: true, status: 200 }; // Mock successful response for users
        } catch (err) {
          console.log("Network error, using sample data");
          setJobs([
            {
              id: 1,
              job_no: 'JOB001',
              current_stage: 'stage1',
              status: 'active',
              created_at: new Date().toISOString(),
              stage1: {
                consignee: 'ABC Trading Co.',
                shipper: 'Global Shipping Ltd.'
              }
            }
          ]);
          setUsers([]);
          setLoading(false);
          return;
        }
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
        console.log("API not available, using sample data");
        setJobs([
          {
            id: 1,
            job_no: 'JOB001',
            current_stage: 'stage1',
            status: 'active',
            created_at: new Date().toISOString(),
            stage1: {
              consignee: 'ABC Trading Co.',
              shipper: 'Global Shipping Ltd.'
            }
          },
          {
            id: 2,
            job_no: 'JOB002',
            current_stage: 'stage2',
            status: 'active',
            created_at: new Date().toISOString(),
            stage1: {
              consignee: 'XYZ Logistics Ltd.',
              shipper: 'Ocean Freight Solutions'
            }
          }
        ]);
        setUsers([]);
      }
    } catch (err) {
      console.log("Unexpected error, using sample data");
      setJobs([
        {
          id: 1,
          job_no: 'JOB001',
          current_stage: 'stage1',
          status: 'active',
          created_at: new Date().toISOString(),
          stage1: {
            consignee: 'ABC Trading Co.',
            shipper: 'Global Shipping Ltd.'
          }
        }
      ]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch consignees for dropdown
  async function fetchConsignees() {
    try {
      // Check if API URL is available
      if (!process.env.NEXT_PUBLIC_API_URL) {
        console.log("API URL not configured, using sample data");
        setConsignees([
          { id: 1, name: 'ABC Trading Co.', address: '123 Business Street, City' },
          { id: 2, name: 'XYZ Logistics Ltd.', address: '456 Commerce Ave, Town' },
          { id: 3, name: 'Global Imports Inc.', address: '789 Import Blvd, Port City' }
        ]);
        return;
      }

      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/consignees", {
        credentials: "include"
      });
      
      if (res.ok) {
        const consigneesData = await res.json();
        console.log("Fetched consignees:", consigneesData);
        setConsignees(Array.isArray(consigneesData) ? consigneesData : []);
        setLastConsigneeUpdate(new Date());
      } else {
        console.log("API not available, using sample data");
        // Fallback to sample data if API fails
        setConsignees([
          { id: 1, name: 'ABC Trading Co.', address: '123 Business Street, City' },
          { id: 2, name: 'XYZ Logistics Ltd.', address: '456 Commerce Ave, Town' },
          { id: 3, name: 'Global Imports Inc.', address: '789 Import Blvd, Port City' }
        ]);
      }
    } catch (err) {
      console.log("Network error, using sample data");
      // Fallback to sample data if network fails
      setConsignees([
        { id: 1, name: 'ABC Trading Co.', address: '123 Business Street, City' },
        { id: 2, name: 'XYZ Logistics Ltd.', address: '456 Commerce Ave, Town' },
        { id: 3, name: 'Global Imports Inc.', address: '789 Import Blvd, Port City' }
      ]);
    }
  }



  // Validation functions
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'job_no':
        if (!value.trim()) error = 'Job number is required';
        else if (value.length < 3) error = 'Job number must be at least 3 characters';
        else if (!/^[A-Z0-9-]+$/.test(value)) error = 'Job number can only contain uppercase letters, numbers, and hyphens';
        break;
      case 'job_date':
        if (!value) error = 'Job date is required';
        else if (new Date(value) > new Date()) error = 'Job date cannot be in the future';
        break;
      case 'edi_job_no':
        if (value && value.length < 2) error = 'EDI job number must be at least 2 characters';
        break;
      case 'edi_date':
        if (value && new Date(value) > new Date()) error = 'EDI date cannot be in the future';
        break;
      case 'consignee':
        if (!value.trim()) error = 'Consignee is required';
        else if (value.length < 3) error = 'Consignee must be at least 3 characters';
        break;
      case 'shipper':
        if (!value.trim()) error = 'Shipper is required';
        else if (value.length < 3) error = 'Shipper must be at least 3 characters';
        break;
      case 'port_of_discharge':
        if (!value.trim()) error = 'Port of discharge is required';
        else if (value.length < 2) error = 'Port of discharge must be at least 2 characters';
        break;
      case 'final_place_of_delivery':
        if (!value.trim()) error = 'Final place of delivery is required';
        else if (value.length < 2) error = 'Final place of delivery must be at least 2 characters';
        break;
      case 'port_of_loading':
        if (!value.trim()) error = 'Port of loading is required';
        else if (value.length < 2) error = 'Port of loading must be at least 2 characters';
        break;
      case 'country_of_shipment':
        if (!value.trim()) error = 'Country of shipment is required';
        else if (value.length < 2) error = 'Country of shipment must be at least 2 characters';
        break;
      case 'hbl_no':
        if (value && value.length < 2) error = 'HBL number must be at least 2 characters';
        break;
      case 'hbl_date':
        if (value && new Date(value) > new Date()) error = 'HBL date cannot be in the future';
        break;
      case 'mbl_no':
        if (value && value.length < 2) error = 'MBL number must be at least 2 characters';
        break;
      case 'mbl_date':
        if (value && new Date(value) > new Date()) error = 'MBL date cannot be in the future';
        break;
      case 'shipping_line':
        if (value && value.length < 2) error = 'Shipping line must be at least 2 characters';
        break;
      case 'forwarder':
        if (value && value.length < 2) error = 'Forwarder must be at least 2 characters';
        break;
      case 'weight':
        if (value < 0) error = 'Weight cannot be negative';
        else if (value > 999999.99) error = 'Weight cannot exceed 999,999.99';
        break;
      case 'packages':
        if (value < 0) error = 'Number of packages cannot be negative';
        else if (value > 999999) error = 'Number of packages cannot exceed 999,999';
        break;
      case 'invoice_no':
        if (value && value.length < 2) error = 'Invoice number must be at least 2 characters';
        break;
      case 'invoice_date':
        if (value && new Date(value) > new Date()) error = 'Invoice date cannot be in the future';
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
      case 'commodity':
        if (value && value.length < 3) error = 'Commodity must be at least 3 characters';
        break;
      case 'eta':
        if (value && new Date(value) < new Date()) error = 'ETA cannot be in the past';
        break;
      case 'current_status':
        if (value && value.length < 3) error = 'Current status must be at least 3 characters';
        break;
      case 'notification_email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Please enter a valid email address';
        break;
      default:
        break;
    }
    
    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    if (!formData.job_no.trim()) {
      newErrors.job_no = 'Job number is required';
    }
    if (!formData.job_date) {
      newErrors.job_date = 'Job date is required';
    }
    if (!formData.consignee.trim()) {
      newErrors.consignee = 'Consignee is required';
    }
    if (!formData.shipper.trim()) {
      newErrors.shipper = 'Shipper is required';
    }
    if (!formData.port_of_discharge.trim()) {
      newErrors.port_of_discharge = 'Port of discharge is required';
    }
    if (!formData.final_place_of_delivery.trim()) {
      newErrors.final_place_of_delivery = 'Final place of delivery is required';
    }
    if (!formData.port_of_loading.trim()) {
      newErrors.port_of_loading = 'Port of loading is required';
    }
    if (!formData.country_of_shipment.trim()) {
      newErrors.country_of_shipment = 'Country of shipment is required';
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
        if (container.date_of_arrival && new Date(container.date_of_arrival) > new Date()) {
          newErrors[`container_${index}_arrival`] = 'Date of arrival cannot be in the future';
        }
      });
      
      // Check if all containers are empty and warn user
      const hasValidContainers = formData.containers.some(container => 
        container && container.container_no && container.container_no.trim() !== ''
      );
      
      if (!hasValidContainers && formData.containers.length > 0) {
        newErrors.containers = 'At least one container must have a valid container number, or remove all empty containers';
      }
    }
    
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
          container_size: '20',
          date_of_arrival: ''
        }
      ]
    }));
  };

  const removeContainer = (index) => {
    setFormData(prev => ({
      ...prev,
      containers: prev.containers.filter((_, i) => i !== index)
    }));
  };

  // Helper function to render form field with error
  const renderFormField = (name, label, type = 'text', required = false, placeholder = '', rows = null) => {
    const isError = errors[name];
    const inputClass = `w-full border rounded-md px-3 py-2 text-black ${
      isError ? 'border-red-500' : 'border-gray-300'
    }`;
    
    // Special case for consignee field - show dropdown with consignees
    if (name === 'consignee') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <select
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            className={inputClass}
          >
            <option value="">Select a consignee</option>
            {consignees.map((consignee) => (
              <option key={consignee.id} value={consignee.name}>
                {consignee.name} - {consignee.address}
              </option>
            ))}
          </select>
          {isError && (
            <p className="text-red-500 text-xs mt-1">{isError}</p>
          )}
          {lastConsigneeUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastConsigneeUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      );
    }
    
    if (type === 'textarea') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            className={inputClass}
            rows={rows || 3}
            placeholder={placeholder}
          />
          {isError && (
            <p className="text-red-500 text-xs mt-1">{isError}</p>
          )}
        </div>
      );
    }
    
    if (type === 'select') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <select
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            className={inputClass}
          >
            {name === 'container_size' ? (
              <>
                <option value="20">20&apos;</option>
                <option value="40">40&apos;</option>
                <option value="LCL">LCL</option>
              </>
            ) : null}
          </select>
          {isError && (
            <p className="text-red-500 text-xs mt-1">{isError}</p>
          )}
        </div>
      );
    }
    
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          className={inputClass}
          placeholder={placeholder}
          required={required}
        />
        {isError && (
          <p className="text-red-500 text-xs mt-1">{isError}</p>
        )}
      </div>
    );
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Sending form data:", formData);
      
      // Filter out empty containers before sending
      const validContainers = (formData.containers || []).filter(container => 
        container && container.container_no && container.container_no.trim() !== ''
      );
      
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
        containers: validContainers,
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
         setErrors({});
         setIsSubmitting(false);
         setFormData({
          job_no: '', job_date: '', edi_job_no: '', edi_date: '', consignee: '', shipper: '',
          port_of_discharge: '', final_place_of_delivery: '', port_of_loading: '', country_of_shipment: '',
          hbl_no: '', hbl_date: '', mbl_no: '', mbl_date: '', shipping_line: '', forwarder: '',
          weight: 0, packages: 0, invoice_no: '', invoice_date: '', gateway_igm: '', gateway_igm_date: '',
          local_igm: '', local_igm_date: '', commodity: '', eta: '', current_status: '',
          containers: [], notification_email: ''
        });
        fetchData();
      } else {
        const errorData = await res.text();
        console.error("Backend error response:", errorData);
        
        // Try to parse JSON error response
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error) {
            alert("Error creating job: " + errorJson.error);
          } else {
            alert("Error creating job: " + errorData);
          }
        } catch (parseError) {
          alert("Error creating job: " + errorData);
        }
      }
         } catch (err) {
       console.error("Error creating job:", err);
       alert("Error creating job");
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

  const handleEditJob = (job) => {
    setEditingJob(job);
    setFormData({
      job_no: job.job_no || '',
      job_date: job.stage1?.job_date || '',
      edi_job_no: job.stage1?.edi_job_no || '',
      edi_date: job.stage1?.edi_date || '',
      consignee: job.stage1?.consignee || '',
      shipper: job.stage1?.shipper || '',
      port_of_discharge: job.stage1?.port_of_discharge || '',
      final_place_of_delivery: job.stage1?.final_place_of_delivery || '',
      port_of_loading: job.stage1?.port_of_loading || '',
      country_of_shipment: job.stage1?.country_of_shipment || '',
      hbl_no: job.stage1?.hbl_no || '',
      hbl_date: job.stage1?.hbl_date || '',
      mbl_no: job.stage1?.mbl_no || '',
      mbl_date: job.stage1?.mbl_date || '',
      shipping_line: job.stage1?.shipping_line || '',
      forwarder: job.stage1?.forwarder || '',
      weight: job.stage1?.weight || 0,
      packages: job.stage1?.packages || 0,
      invoice_no: job.stage1?.invoice_no || '',
      invoice_date: job.stage1?.invoice_date || '',
      gateway_igm: job.stage1?.gateway_igm || '',
      gateway_igm_date: job.stage1?.gateway_igm_date || '',
      local_igm: job.stage1?.local_igm || '',
      local_igm_date: job.stage1?.local_igm_date || '',
      commodity: job.stage1?.commodity || '',
      eta: job.stage1?.eta || '',
      current_status: job.stage1?.current_status || '',
      containers: job.stage1Containers || [],
      notification_email: job.notification_email || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Filter out empty containers before sending
      const validContainers = (formData.containers || []).filter(container => 
        container && container.container_no && container.container_no.trim() !== ''
      );
      
      const updateData = {
        ...formData,
        weight: parseInt(formData.weight) || 0,
        packages: parseInt(formData.packages) || 0,
        containers: validContainers
      };

      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/api/pipeline/jobs/${editingJob.id}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData)
      });

             if (res.ok) {
         setShowEditModal(false);
         setEditingJob(null);
         setErrors({});
         setIsSubmitting(false);
         setFormData({
          job_no: '', job_date: '', edi_job_no: '', edi_date: '', consignee: '', shipper: '',
          port_of_discharge: '', final_place_of_delivery: '', port_of_loading: '', country_of_shipment: '',
          hbl_no: '', hbl_date: '', mbl_no: '', mbl_date: '', shipping_line: '', forwarder: '',
          weight: 0, packages: 0, invoice_no: '', invoice_date: '', gateway_igm: '', gateway_igm_date: '',
          local_igm: '', local_igm_date: '', commodity: '', eta: '', current_status: '',
          containers: [], notification_email: ''
        });
        fetchData();
        alert('Job updated successfully!');
      } else {
        const errorData = await res.text();
        console.error("Backend error response:", errorData);
        
        // Try to parse JSON error response
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error) {
            alert("Error updating job: " + errorJson.error);
          } else {
            alert("Error updating job: " + errorData);
          }
        } catch (parseError) {
          alert("Error updating job: " + errorData);
        }
      }
         } catch (err) {
       console.error("Error updating job:", err);
       alert("Error updating job");
     } finally {
       setIsSubmitting(false);
     }
  };

  const [userRole, setUserRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubadmin, setIsSubadmin] = useState(false);
  
  // Validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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
                {(isAdmin || isSubadmin) ? 'Pipeline Management' : `${userRole === 'stage1_employee' ? 'My Created Jobs' : userRole === 'stage2_employee' ? 'Stage 2 Jobs' : userRole === 'stage3_employee' ? 'Stage 3 Jobs' : 'Stage 4 Jobs'}`}
              </h1>
              <p className="text-gray-600 mt-1">
                {(isAdmin || isSubadmin)
                  ? 'Manage import/export pipeline jobs' 
                  : userRole === 'stage1_employee' 
                    ? 'View and manage jobs you created'
                    : `View and manage jobs currently in ${userRole === 'stage2_employee' ? 'Stage 2 (Customs & Docs)' : userRole === 'stage3_employee' ? 'Stage 3 (Clearance & Logistics)' : 'Stage 4 (Billing)'}`
                }
              </p>
            </div>
                         {(isAdmin || isSubadmin || userRole === 'stage1_employee') && (
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
              {(isAdmin || isSubadmin) ? 'All Pipeline Jobs' : 'My Stage Jobs'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed" style={{minWidth: '900px'}}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>Job No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '20%'}}>Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '10%'}}>Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>Consignee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>Shipper</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '10%'}}>Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>Actions</th>
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
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={job.Stage1?.consignee || job.stage1?.consignee || job.consignee || '-'}>
                      {job.Stage1?.consignee || job.stage1?.consignee || job.consignee || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={job.Stage1?.shipper || job.stage1?.shipper || job.shipper || '-'}>
                      {job.Stage1?.shipper || job.stage1?.shipper || job.shipper || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/pipeline/jobs/${job.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                        {(isAdmin || isSubadmin) && (
                          <button
                            onClick={() => handleEditJob(job)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit Job"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
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
                            onClick={() => {
                              setShowCreateModal(false);
                              setErrors({});
                              setIsSubmitting(false);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        </div>

                        <form onSubmit={handleCreateJob} className="space-y-6">
                          {/* Basic Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderFormField('job_no', 'Job No. *', 'text', true)}
                            {renderFormField('job_date', 'Job Date', 'date')}
                          </div>

                          {/* EDI Information - Commented out as per request
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderFormField('edi_job_no', 'EDI Job No.')}
                            {renderFormField('edi_date', 'EDI Date', 'date')}
                          </div>
                          */}

                          {/* Parties */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderFormField('consignee', 'Consignee', 'select')}
                            {renderFormField('shipper', 'Shipper', 'textarea')}
                          </div>

                          {/* Ports */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderFormField('port_of_discharge', 'Port of Discharge')}
                            {renderFormField('final_place_of_delivery', 'Final Place of Delivery')}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderFormField('port_of_loading', 'Port of Loading')}
                            {renderFormField('country_of_shipment', 'Country of Shipment')}
                          </div>

                          {/* Bill of Lading */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderFormField('hbl_no', 'HBL No.')}
                            {renderFormField('hbl_date', 'HBL Date', 'date')}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderFormField('mbl_no', 'MBL No.')}
                            {renderFormField('mbl_date', 'MBL Date', 'date')}
                          </div>

                          {/* Shipping Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderFormField('shipping_line', 'Shipping Line')}
                            {renderFormField('forwarder', 'Forwarder')}
                          </div>

                          {/* Cargo Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderFormField('weight', 'Weight (KG)', 'text')}
                            {renderFormField('packages', 'Packages', 'text')}
                          </div>

                          {/* Invoice Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderFormField('invoice_no', 'Invoice No.')}
                            {renderFormField('invoice_date', 'Invoice Date', 'date')}
                          </div>

                          {/* Additional Details */}
                          {renderFormField('commodity', 'Commodity', 'textarea')}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderFormField('eta', 'ETA', 'date')}
                            {renderFormField('current_status', 'Current Status')}
                          </div>

                          {/* Container Details */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-semibold text-gray-900">Container Details</h3>
                              <button
                                type="button"
                                onClick={addContainer}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                              >
                                <span>+</span> Add Container
                              </button>
                            </div>
                            
                            {errors.containers && (
                              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                                {errors.containers}
                              </div>
                            )}
                            
                            {formData.containers && formData.containers.map((container, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="font-medium text-gray-900">Container {index + 1}</h4>
                                  <button
                                    type="button"
                                    onClick={() => removeContainer(index)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Container No.</label>
                                    <input
                                      type="text"
                                      name={`container_no_${index}`}
                                      value={container.container_no}
                                      onChange={(e) => handleContainerChange(index, 'container_no', e.target.value)}
                                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                    />
                                    {errors[`container_${index}_no`] && (
                                      <p className="text-red-500 text-xs mt-1">{errors[`container_${index}_no`]}</p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Container Size</label>
                                    <select
                                      name={`container_size_${index}`}
                                      value={container.container_size}
                                      onChange={(e) => handleContainerChange(index, 'container_size', e.target.value)}
                                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black" 
                                    >
                                      <option value="20">20&apos;</option>
                                      <option value="40">40&apos;</option>
                                      <option value="LCL">LCL</option>
                                    </select>
                                  </div>
                                  {/* Date of Arrival section commented out as per request
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Arrival</label>
                                    <input
                                      type="date"
                                      name={`container_date_of_arrival_${index}`}
                                      value={container.date_of_arrival}
                                      onChange={(e) => handleContainerChange(index, 'date_of_arrival', e.target.value)}
                                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                                    />
                                    {errors[`container_${index}_arrival`] && (
                                      <p className="text-red-500 text-xs mt-1">{errors[`container_${index}_arrival`]}</p>
                                    )}
                                  </div>
                                  */}
                                </div>
                              </div>
                            ))}
                            
                            {(!formData.containers || formData.containers.length === 0) && (
                              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                <p>No containers added yet. Click &quot;Add Container&quot; to start.</p>
                              </div>
                            )}
                          </div>

                {/* Notification Email section commented out as per request
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
                */}

                                 <div className="flex justify-end gap-4 pt-6">
                   <button
                     type="button"
                     onClick={() => setShowCreateModal(false)}
                     className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                     disabled={isSubmitting}
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     className={`px-4 py-2 text-white rounded-md transition-colors ${
                       isSubmitting 
                         ? 'bg-gray-400 cursor-not-allowed' 
                         : 'bg-blue-600 hover:bg-blue-700'
                     }`}
                     disabled={isSubmitting}
                   >
                     {isSubmitting ? 'Creating...' : 'Create Job'}
                   </button>
                 </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {showEditModal && editingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Pipeline Job - {editingJob.job_no}</h2>
                                 <button
                   onClick={() => {
                     setShowEditModal(false);
                     setErrors({});
                     setIsSubmitting(false);
                   }}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   ×
                 </button>
              </div>

                             <form onSubmit={handleUpdateJob} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFormField('job_no', 'Job No. *', 'text', true)}
                  {renderFormField('job_date', 'Job Date', 'date')}
                </div>

                {/* EDI Information - Commented out as per request
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFormField('edi_job_no', 'EDI Job No.')}
                  {renderFormField('edi_date', 'EDI Date', 'date')}
                </div>
                */}

                {/* Parties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFormField('consignee', 'Consignee', 'select')}
                  {renderFormField('shipper', 'Shipper', 'textarea')}
                </div>

                {/* Ports */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFormField('port_of_discharge', 'Port of Discharge')}
                  {renderFormField('final_place_of_delivery', 'Final Place of Delivery')}
                  {renderFormField('port_of_loading', 'Port of Loading')}
                </div>

                {/* Country and Documents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFormField('country_of_shipment', 'Country of Shipment')}
                  {renderFormField('hbl_no', 'HBL No.')}
                </div>

                {/* HBL and MBL Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFormField('hbl_date', 'HBL Date', 'date')}
                  {renderFormField('mbl_no', 'MBL No.')}
                </div>

                {/* MBL Date and Shipping Line */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFormField('mbl_date', 'MBL Date', 'date')}
                  {renderFormField('shipping_line', 'Shipping Line')}
                </div>

                {/* Forwarder and Weight */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFormField('forwarder', 'Forwarder')}
                  {renderFormField('weight', 'Weight (kg)', 'text')}
                </div>

                {/* Packages */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFormField('packages', 'Packages', 'text')}
                  {renderFormField('invoice_date', 'Invoice Date', 'date')}
                </div>

                {/* Commodity */}
                {renderFormField('commodity', 'Commodity', 'text')}

                {/* ETA and Current Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFormField('eta', 'ETA', 'date')}
                  {renderFormField('current_status', 'Current Status')}
                </div>

                {/* Container Details */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Container Details</h3>
                    <button
                      type="button"
                      onClick={addContainer}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                      <span>+</span> Add Container
                    </button>
                  </div>
                  
                  {errors.containers && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                      {errors.containers}
                    </div>
                  )}
                  
                  {formData.containers && formData.containers.map((container, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">Container {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeContainer(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Container No.</label>
                          <input
                            type="text"
                            name={`container_no_${index}`}
                            value={container.container_no}
                            onChange={(e) => handleContainerChange(index, 'container_no', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                          />
                          {errors[`container_${index}_no`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`container_${index}_no`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Container Size</label>
                          <select
                            name={`container_size_${index}`}
                            value={container.container_size}
                            onChange={(e) => handleContainerChange(index, 'container_size', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-black" 
                          >
                            <option value="20">20&apos;</option>
                            <option value="40">40&apos;</option>
                            <option value="LCL">LCL</option>
                          </select>
                        </div>
                        {/* Date of Arrival section commented out as per request
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Arrival</label>
                          <input
                            type="date"
                            name={`container_date_of_arrival_${index}`}
                            value={container.date_of_arrival}
                            onChange={(e) => handleContainerChange(index, 'date_of_arrival', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                          />
                          {errors[`container_${index}_arrival`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`container_${index}_arrival`]}</p>
                          )}
                        </div>
                        */}
                      </div>
                    </div>
                  ))}
                  
                  {(!formData.containers || formData.containers.length === 0) && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <p>No containers added yet. Click &quot;Add Container&quot; to start.</p>
                    </div>
                  )}
                </div>

                {/* Notification Email section commented out as per request
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
                */}

                                 <div className="flex justify-end gap-4 pt-6">
                   <button
                     type="button"
                     onClick={() => setShowEditModal(false)}
                     className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                     disabled={isSubmitting}
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     className={`px-4 py-2 text-white rounded-md transition-colors ${
                       isSubmitting 
                         ? 'bg-gray-400 cursor-not-allowed' 
                         : 'bg-yellow-600 hover:bg-yellow-700'
                     }`}
                     disabled={isSubmitting}
                   >
                     {isSubmitting ? 'Updating...' : 'Update Job'}
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
