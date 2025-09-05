"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import FileUpload from "../../../components/FileUpload";
import StageDetailsModal from "../../../components/StageDetailsModal";

export default function JobDetailsPage() {
  const params = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStageDetailsModalOpen, setIsStageDetailsModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [userNames, setUserNames] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Add this helper above fetchJobDetails
  const normalizeJob = (raw) => {
    if (!raw || typeof raw !== "object") return raw;

    // Prefer existing camelCase if present; otherwise map from PascalCase
    const stage1 = raw.stage1 ?? raw.Stage1 ?? null;
    const stage2 = raw.stage2 ?? raw.Stage2 ?? null;
    const stage3Base = raw.stage3 ?? raw.Stage3 ?? null;
    const stage4 = raw.stage4 ?? raw.Stage4 ?? null;

    // Merge Stage3Containers into stage3.containers
    const stage3Containers = raw.Stage3Containers ?? [];
    const stage3 =
      stage3Base || stage3Containers.length ? { ...(stage3Base || {}) } : null;

    if (stage3) {
      const existing = Array.isArray(stage3.containers)
        ? stage3.containers
        : [];
      const mapped = stage3Containers.map((c) => ({
        container_no: c.container_no ?? null,
        size: c.size ?? null,
        vehicle_no: c.vehicle_no ?? null,
        date_of_offloading: c.date_of_offloading ?? null,
        empty_return_date: c.empty_return_date ?? null,
      }));
      stage3.containers = [...existing, ...mapped];
    }

    return {
      ...raw,
      stage1,
      stage2,
      stage3,
      stage4,
    };
  };

  const fetchJobDetails = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${params.id}`,
        {
          credentials: "include",
        }
      );

      if (res.status === 403) {
        window.location.href = "/login";
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const payload = Array.isArray(data)
          ? data.find((j) => String(j.id) === String(params.id)) ?? data[0]
          : data;

        const normalized = normalizeJob(payload);
        console.log("Job details received:", normalized);
        setJob(normalized);
      } else {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        alert("Job not found or access denied");
        window.location.href = "/pipeline";
      }
    } catch (err) {
      console.error("Error fetching job details:", err);
      setError("Failed to load job details");
    } finally {
      setLoading(false);
    }
  }, [params.id]); // Add params.id as dependency

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || "stage1_employee");
      setIsAdmin(user.is_admin || false);
    }
    fetchJobDetails();
    fetchUserNames();
  }, [fetchJobDetails]);

  const fetchUserNames = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users`,
        { credentials: "include" }
      );
      if (response.ok) {
        const users = await response.json();
        const nameMap = {};
        users.forEach(user => {
          nameMap[user.id] = user.username;
        });
        setUserNames(nameMap);
      }
    } catch (error) {
      console.error("Error fetching user names:", error);
    }
  };
  const handleFileUploaded = (stage) => {
    // File upload handled by FileUpload component
    console.log(`Files uploaded to ${stage}`);
  };

  const openStageDetails = (stage, stageData) => {
    setSelectedStage({ stage, stageData });
    setIsStageDetailsModalOpen(true);
  };

  const closeStageDetails = () => {
    setIsStageDetailsModalOpen(false);
    setSelectedStage(null);
  };

  const openEditModal = (stage, stageData) => {
    setEditingStage(stage);
    setEditFormData(stageData || {});
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingStage(null);
    setEditFormData({});
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveStageData = async () => {
    if (!editingStage || !job) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${params.id}/${editingStage}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(editFormData)
        }
      );

      if (response.ok) {
        // Refresh job data
        await fetchJobDetails();
        closeEditModal();
        alert('Stage data updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to update stage data'}`);
      }
    } catch (error) {
      console.error('Error saving stage data:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return `₹${parseFloat(amount).toLocaleString()}`;
  };

  const getStageName = (stage) => {
    switch (stage) {
      case "stage1":
        return "Initial Setup";
      case "stage2":
        return "Customs & Documentation";
      case "stage3":
        return "Clearance & Logistics";
      case "stage4":
        return "Billing & Completion";
      case "completed":
        return "Completed";
      default:
        return stage;
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case "stage1":
        return "bg-blue-100 text-blue-800";
      case "stage2":
        return "bg-yellow-100 text-yellow-800";
      case "stage3":
        return "bg-purple-100 text-purple-800";
      case "stage4":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <p className="text-gray-600">{error || "Job not found"}</p>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Job Details
                </h1>
                <p className="text-gray-600 mt-2">Job No: {job.job_no}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStageColor(
                    job.current_stage
                  )}`}
                >
                  {getStageName(job.current_stage)}
                </span>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    job.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {job.status}
                </span>
              </div>
            </div>
          </div>

          {/* Job Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Stage 1: Initial Setup */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </span>
                  Stage 1: Initial Setup
                </div>
                {job.stage1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openStageDetails("stage1", job.stage1)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="View complete details"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => openEditModal("stage1", job.stage1)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Edit stage data"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </h2>

              {!job.stage1 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">📋</span>
                  <p className="text-gray-600">No data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Consignee
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage1.consignee || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Shipper
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage1.shipper || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Commodity
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage1.commodity || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Weight
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage1.weight || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Packages
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage1.packages || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Container No
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage1.container_no || "N/A"}
                      </p>
                    </div>
                  </div>
                  
                  {/* User Information */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <div className="mb-2">
                        <span className="font-medium text-gray-600">Created By:</span>
                        <span className="ml-2 text-gray-900">
                          {job.stage1.created_by ? (userNames[job.stage1.created_by] || `User ID: ${job.stage1.created_by}`) : "Not Available"}
                        </span>
                      </div>
                      {job.stage1.updated_by && job.stage1.updated_by !== job.stage1.created_by && (
                        <div>
                          <span className="font-medium text-gray-600">Last Updated By:</span>
                          <span className="ml-2 text-gray-900">
                            {userNames[job.stage1.updated_by] || `User ID: ${job.stage1.updated_by}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload for Stage 1 */}
              <div className="mt-6">
                <FileUpload
                  jobId={params.id}
                  stage="stage1"
                  onFileUploaded={() => handleFileUploaded("stage1")}
                  userRole={userRole}
                  isAdmin={isAdmin}
                  isSubadmin={userRole === "subadmin"}
                />
              </div>
            </div>

            {/* Stage 2: Customs & Documentation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-yellow-600 text-xs font-bold">2</span>
                  </span>
                  Stage 2: Customs & Documentation
                </div>
                {job.stage2 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openStageDetails("stage2", job.stage2)}
                      className="text-yellow-600 hover:text-yellow-800 transition-colors"
                      title="View complete details"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => openEditModal("stage2", job.stage2)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Edit stage data"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </h2>

              {!job.stage2 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">📋</span>
                  <p className="text-gray-600">Pending customs documentation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        HSN Code
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage2.hsn_code || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Documents Type
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage2.documents_type || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Filing Requirement
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage2.filing_requirement || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Checklist Sent
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(job.stage2.checklist_sent_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Approval Date
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(job.stage2.approval_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Bill of Entry No
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage2.bill_of_entry_no || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Bill of Entry Date
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(job.stage2.bill_of_entry_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Duty Amount
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(job.stage2.duty_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Duty Paid By
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage2.duty_paid_by || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Ocean Freight
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(job.stage2.ocean_freight)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Destination Charges
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(job.stage2.destination_charges)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        DRN No
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage2.drn_no || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        IRN No
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage2.irn_no || "N/A"}
                      </p>
                    </div>
                  </div>
                  
                  {/* User Information */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <div className="mb-2">
                        <span className="font-medium text-gray-600">Created By:</span>
                        <span className="ml-2 text-gray-900">
                          {job.stage2.created_by ? (userNames[job.stage2.created_by] || `User ID: ${job.stage2.created_by}`) : "Not Available"}
                        </span>
                      </div>
                      {job.stage2.updated_by && job.stage2.updated_by !== job.stage2.created_by && (
                        <div>
                          <span className="font-medium text-gray-600">Last Updated By:</span>
                          <span className="ml-2 text-gray-900">
                            {userNames[job.stage2.updated_by] || `User ID: ${job.stage2.updated_by}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* File Upload for Stage 2 */}
              <div className="mt-6">
                <FileUpload
                  jobId={params.id}
                  stage="stage2"
                  onFileUploaded={() => handleFileUploaded("stage2")}
                  userRole={userRole}
                  isAdmin={isAdmin}
                  isSubadmin={userRole === "subadmin"}
                />
              </div>
            </div>

            {/* Stage 3: Clearance & Logistics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-purple-600 text-xs font-bold">3</span>
                  </span>
                  Stage 3: Clearance & Logistics
                </div>
                {job.stage3 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openStageDetails("stage3", job.stage3)}
                      className="text-purple-600 hover:text-purple-800 transition-colors"
                      title="View complete details"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => openEditModal("stage3", job.stage3)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Edit stage data"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </h2>

              {!job.stage3 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">📋</span>
                  <p className="text-gray-600">Pending clearance data</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Exam Date
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(job.stage3.exam_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Out of Charge
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(job.stage3.out_of_charge)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Clearance Expenses
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(job.stage3.clearance_exps)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Stamp Duty
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(job.stage3.stamp_duty)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Custodian
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage3.custodian || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Offloading Charges
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(job.stage3.offloading_charges)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Transport Detention
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(job.stage3.transport_detention)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Dispatch Info
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage3.dispatch_info || "N/A"}
                      </p>
                    </div>
                  </div>
                  
                  {/* User Information */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <div className="mb-2">
                        <span className="font-medium text-gray-600">Created By:</span>
                        <span className="ml-2 text-gray-900">
                          {job.stage3.created_by ? (userNames[job.stage3.created_by] || `User ID: ${job.stage3.created_by}`) : "Not Available"}
                        </span>
                      </div>
                      {job.stage3.updated_by && job.stage3.updated_by !== job.stage3.created_by && (
                        <div>
                          <span className="font-medium text-gray-600">Last Updated By:</span>
                          <span className="ml-2 text-gray-900">
                            {userNames[job.stage3.updated_by] || `User ID: ${job.stage3.updated_by}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Containers */}
                  {job.stage3.containers &&
                    job.stage3.containers.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          Containers
                        </h3>
                        <div className="space-y-2">
                          {job.stage3.containers.map((container, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-medium">
                                    Container:
                                  </span>{" "}
                                  {container.container_no || "N/A"}
                                </div>
                                <div>
                                  <span className="font-medium">Size:</span>{" "}
                                  {container.size || "N/A"}
                                </div>
                                <div>
                                  <span className="font-medium">Vehicle:</span>{" "}
                                  {container.vehicle_no || "N/A"}
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Offloading:
                                  </span>{" "}
                                  {formatDate(container.date_of_offloading)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* File Upload for Stage 3 */}
              <div className="mt-6">
                <FileUpload
                  jobId={params.id}
                  stage="stage3"
                  onFileUploaded={() => handleFileUploaded("stage3")}
                  userRole={userRole}
                  isAdmin={isAdmin}
                  isSubadmin={userRole === "subadmin"}
                />
              </div>
            </div>

            {/* Stage 4: Billing & Completion */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-orange-600 text-xs font-bold">4</span>
                  </span>
                  <div>
                    <div>Stage 4: Billing & Completion</div>
                    {job.stage4 && job.stage4.updated_by && job.stage4.updated_by !== job.stage4.created_by && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Last Updated By:</span>
                        <span className="ml-1 text-gray-800">
                          {userNames[job.stage4.updated_by] || 'Not Available'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {job.stage4 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openStageDetails("stage4", job.stage4)}
                      className="text-orange-600 hover:text-orange-800 transition-colors"
                      title="View complete details"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => openEditModal("stage4", job.stage4)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Edit stage data"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </h2>

              {!job.stage4 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">📋</span>
                  <p className="text-gray-600">Pending billing data</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Bill No
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage4.bill_no || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Bill Date
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(job.stage4.bill_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Amount Taxable
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(job.stage4.amount_taxable)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        GST 5%
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(job.stage4.gst_5_percent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        GST 18%
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(job.stage4.gst_18_percent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Bill Mail
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage4.bill_mail || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Bill Courier
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage4.bill_courier || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Courier Date
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(job.stage4.courier_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Acknowledge Date
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(job.stage4.acknowledge_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Acknowledge Name
                      </p>
                      <p className="text-sm text-gray-900">
                        {job.stage4.acknowledge_name || "N/A"}
                      </p>
                    </div>
                  </div>
                  
                </div>
              )}

              {/* File Upload for Stage 4 */}
              <div className="mt-6">
                <FileUpload
                  jobId={params.id}
                  stage="stage4"
                  onFileUploaded={() => handleFileUploaded("stage4")}
                  userRole={userRole}
                  isAdmin={isAdmin}
                  isSubadmin={userRole === "subadmin"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Details Modal */}
      {isStageDetailsModalOpen && selectedStage && (
        <StageDetailsModal
          isOpen={isStageDetailsModalOpen}
          onClose={closeStageDetails}
          stage={selectedStage.stage}
          stageData={selectedStage.stageData}
          stageNumber={selectedStage.stage.replace("stage", "")}
          stageName={getStageName(selectedStage.stage)}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingStage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Edit {getStageName(editingStage)} Data
              </h2>
              <button
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {editingStage === "stage1" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job No
                      </label>
                      <input
                        type="text"
                        value={editFormData.job_no || ""}
                        onChange={(e) => handleEditFormChange("job_no", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.job_date ? editFormData.job_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("job_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        EDI Job No
                      </label>
                      <input
                        type="text"
                        value={editFormData.edi_job_no || ""}
                        onChange={(e) => handleEditFormChange("edi_job_no", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        EDI Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.edi_date ? editFormData.edi_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("edi_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Consignee
                      </label>
                      <input
                        type="text"
                        value={editFormData.consignee || ""}
                        onChange={(e) => handleEditFormChange("consignee", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shipper
                      </label>
                      <input
                        type="text"
                        value={editFormData.shipper || ""}
                        onChange={(e) => handleEditFormChange("shipper", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Port of Discharge
                      </label>
                      <input
                        type="text"
                        value={editFormData.port_of_discharge || ""}
                        onChange={(e) => handleEditFormChange("port_of_discharge", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Final Place of Delivery
                      </label>
                      <input
                        type="text"
                        value={editFormData.final_place_of_delivery || ""}
                        onChange={(e) => handleEditFormChange("final_place_of_delivery", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Port of Loading
                      </label>
                      <input
                        type="text"
                        value={editFormData.port_of_loading || ""}
                        onChange={(e) => handleEditFormChange("port_of_loading", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country of Shipment
                      </label>
                      <input
                        type="text"
                        value={editFormData.country_of_shipment || ""}
                        onChange={(e) => handleEditFormChange("country_of_shipment", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        HBL No
                      </label>
                      <input
                        type="text"
                        value={editFormData.hbl_no || ""}
                        onChange={(e) => handleEditFormChange("hbl_no", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        HBL Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.hbl_date ? editFormData.hbl_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("hbl_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        MBL No
                      </label>
                      <input
                        type="text"
                        value={editFormData.mbl_no || ""}
                        onChange={(e) => handleEditFormChange("mbl_no", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        MBL Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.mbl_date ? editFormData.mbl_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("mbl_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shipping Line
                      </label>
                      <input
                        type="text"
                        value={editFormData.shipping_line || ""}
                        onChange={(e) => handleEditFormChange("shipping_line", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Forwarder
                      </label>
                      <input
                        type="text"
                        value={editFormData.forwarder || ""}
                        onChange={(e) => handleEditFormChange("forwarder", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weight
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.weight || ""}
                        onChange={(e) => handleEditFormChange("weight", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Packages
                      </label>
                      <input
                        type="number"
                        value={editFormData.packages || ""}
                        onChange={(e) => handleEditFormChange("packages", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invoice No
                      </label>
                      <input
                        type="text"
                        value={editFormData.invoice_no || ""}
                        onChange={(e) => handleEditFormChange("invoice_no", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invoice Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.invoice_date ? editFormData.invoice_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("invoice_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gateway IGM
                      </label>
                      <input
                        type="text"
                        value={editFormData.gateway_igm || ""}
                        onChange={(e) => handleEditFormChange("gateway_igm", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gateway IGM Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.gateway_igm_date ? editFormData.gateway_igm_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("gateway_igm_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Local IGM
                      </label>
                      <input
                        type="text"
                        value={editFormData.local_igm || ""}
                        onChange={(e) => handleEditFormChange("local_igm", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Local IGM Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.local_igm_date ? editFormData.local_igm_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("local_igm_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Commodity
                      </label>
                      <input
                        type="text"
                        value={editFormData.commodity || ""}
                        onChange={(e) => handleEditFormChange("commodity", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ETA
                      </label>
                      <input
                        type="date"
                        value={editFormData.eta ? editFormData.eta.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("eta", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Status
                      </label>
                      <input
                        type="text"
                        value={editFormData.current_status || ""}
                        onChange={(e) => handleEditFormChange("current_status", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Container No
                      </label>
                      <input
                        type="text"
                        value={editFormData.container_no || ""}
                        onChange={(e) => handleEditFormChange("container_no", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Container Size
                      </label>
                      <input
                        type="text"
                        value={editFormData.container_size || ""}
                        onChange={(e) => handleEditFormChange("container_size", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Arrival
                      </label>
                      <input
                        type="date"
                        value={editFormData.date_of_arrival ? editFormData.date_of_arrival.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("date_of_arrival", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invoice PL Doc
                      </label>
                      <input
                        type="text"
                        value={editFormData.invoice_pl_doc || ""}
                        onChange={(e) => handleEditFormChange("invoice_pl_doc", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        BL Doc
                      </label>
                      <input
                        type="text"
                        value={editFormData.bl_doc || ""}
                        onChange={(e) => handleEditFormChange("bl_doc", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        COO Doc
                      </label>
                      <input
                        type="text"
                        value={editFormData.coo_doc || ""}
                        onChange={(e) => handleEditFormChange("coo_doc", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Created By
                      </label>
                      <input
                        type="text"
                        value={editFormData.created_by || ""}
                        onChange={(e) => handleEditFormChange("created_by", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Updated By
                      </label>
                      <input
                        type="text"
                        value={editFormData.updated_by || ""}
                        onChange={(e) => handleEditFormChange("updated_by", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {editingStage === "stage2" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        HSN Code
                      </label>
                      <input
                        type="text"
                        value={editFormData.hsn_code || ""}
                        onChange={(e) => handleEditFormChange("hsn_code", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Filing Requirement
                      </label>
                      <textarea
                        value={editFormData.filing_requirement || ""}
                        onChange={(e) => handleEditFormChange("filing_requirement", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Checklist Sent Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.checklist_sent_date ? editFormData.checklist_sent_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("checklist_sent_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Approval Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.approval_date ? editFormData.approval_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("approval_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill of Entry No
                      </label>
                      <input
                        type="text"
                        value={editFormData.bill_of_entry_no || ""}
                        onChange={(e) => handleEditFormChange("bill_of_entry_no", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill of Entry Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.bill_of_entry_date ? editFormData.bill_of_entry_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("bill_of_entry_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Debit Note
                      </label>
                      <input
                        type="text"
                        value={editFormData.debit_note || ""}
                        onChange={(e) => handleEditFormChange("debit_note", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Debit Paid By
                      </label>
                      <input
                        type="text"
                        value={editFormData.debit_paid_by || ""}
                        onChange={(e) => handleEditFormChange("debit_paid_by", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duty Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.duty_amount || ""}
                        onChange={(e) => handleEditFormChange("duty_amount", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duty Paid By
                      </label>
                      <input
                        type="text"
                        value={editFormData.duty_paid_by || ""}
                        onChange={(e) => handleEditFormChange("duty_paid_by", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ocean Freight
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.ocean_freight || ""}
                        onChange={(e) => handleEditFormChange("ocean_freight", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Destination Charges
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.destination_charges || ""}
                        onChange={(e) => handleEditFormChange("destination_charges", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Original Doc Received Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.original_doct_recd_date ? editFormData.original_doct_recd_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("original_doct_recd_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DRN No
                      </label>
                      <input
                        type="text"
                        value={editFormData.drn_no || ""}
                        onChange={(e) => handleEditFormChange("drn_no", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IRN No
                      </label>
                      <input
                        type="text"
                        value={editFormData.irn_no || ""}
                        onChange={(e) => handleEditFormChange("irn_no", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Documents Type
                      </label>
                      <input
                        type="text"
                        value={editFormData.documents_type || ""}
                        onChange={(e) => handleEditFormChange("documents_type", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document 1
                      </label>
                      <input
                        type="text"
                        value={editFormData.document_1 || ""}
                        onChange={(e) => handleEditFormChange("document_1", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document 2
                      </label>
                      <input
                        type="text"
                        value={editFormData.document_2 || ""}
                        onChange={(e) => handleEditFormChange("document_2", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document 3
                      </label>
                      <input
                        type="text"
                        value={editFormData.document_3 || ""}
                        onChange={(e) => handleEditFormChange("document_3", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document 4
                      </label>
                      <input
                        type="text"
                        value={editFormData.document_4 || ""}
                        onChange={(e) => handleEditFormChange("document_4", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document 5
                      </label>
                      <input
                        type="text"
                        value={editFormData.document_5 || ""}
                        onChange={(e) => handleEditFormChange("document_5", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document 6
                      </label>
                      <input
                        type="text"
                        value={editFormData.document_6 || ""}
                        onChange={(e) => handleEditFormChange("document_6", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Query Upload
                      </label>
                      <input
                        type="text"
                        value={editFormData.query_upload || ""}
                        onChange={(e) => handleEditFormChange("query_upload", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reply Upload
                      </label>
                      <input
                        type="text"
                        value={editFormData.reply_upload || ""}
                        onChange={(e) => handleEditFormChange("reply_upload", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Created By
                      </label>
                      <input
                        type="text"
                        value={editFormData.created_by || ""}
                        onChange={(e) => handleEditFormChange("created_by", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Updated By
                      </label>
                      <input
                        type="text"
                        value={editFormData.updated_by || ""}
                        onChange={(e) => handleEditFormChange("updated_by", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {editingStage === "stage3" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.exam_date ? editFormData.exam_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("exam_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Out of Charge
                      </label>
                      <input
                        type="date"
                        value={editFormData.out_of_charge ? editFormData.out_of_charge.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("out_of_charge", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clearance Expenses
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.clearance_exps || ""}
                        onChange={(e) => handleEditFormChange("clearance_exps", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stamp Duty
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.stamp_duty || ""}
                        onChange={(e) => handleEditFormChange("stamp_duty", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custodian
                      </label>
                      <input
                        type="text"
                        value={editFormData.custodian || ""}
                        onChange={(e) => handleEditFormChange("custodian", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Offloading Charges
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.offloading_charges || ""}
                        onChange={(e) => handleEditFormChange("offloading_charges", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transport Detention
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.transport_detention || ""}
                        onChange={(e) => handleEditFormChange("transport_detention", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dispatch Info
                      </label>
                      <input
                        type="text"
                        value={editFormData.dispatch_info || ""}
                        onChange={(e) => handleEditFormChange("dispatch_info", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill of Entry Upload
                      </label>
                      <input
                        type="text"
                        value={editFormData.bill_of_entry_upload || ""}
                        onChange={(e) => handleEditFormChange("bill_of_entry_upload", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Created By
                      </label>
                      <input
                        type="text"
                        value={editFormData.created_by || ""}
                        onChange={(e) => handleEditFormChange("created_by", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Updated By
                      </label>
                      <input
                        type="text"
                        value={editFormData.updated_by || ""}
                        onChange={(e) => handleEditFormChange("updated_by", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {editingStage === "stage4" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill No
                      </label>
                      <input
                        type="text"
                        value={editFormData.bill_no || ""}
                        onChange={(e) => handleEditFormChange("bill_no", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.bill_date ? editFormData.bill_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("bill_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount Taxable
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.amount_taxable || ""}
                        onChange={(e) => handleEditFormChange("amount_taxable", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GST 5%
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.gst_5_percent || ""}
                        onChange={(e) => handleEditFormChange("gst_5_percent", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GST 18%
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.gst_18_percent || ""}
                        onChange={(e) => handleEditFormChange("gst_18_percent", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill Mail
                      </label>
                      <input
                        type="text"
                        value={editFormData.bill_mail || ""}
                        onChange={(e) => handleEditFormChange("bill_mail", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill Courier
                      </label>
                      <input
                        type="text"
                        value={editFormData.bill_courier || ""}
                        onChange={(e) => handleEditFormChange("bill_courier", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Courier Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.courier_date ? editFormData.courier_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("courier_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Acknowledge Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.acknowledge_date ? editFormData.acknowledge_date.split('T')[0] : ""}
                        onChange={(e) => handleEditFormChange("acknowledge_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Acknowledge Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.acknowledge_name || ""}
                        onChange={(e) => handleEditFormChange("acknowledge_name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill Copy Upload
                      </label>
                      <input
                        type="text"
                        value={editFormData.bill_copy_upload || ""}
                        onChange={(e) => handleEditFormChange("bill_copy_upload", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Created By
                      </label>
                      <input
                        type="text"
                        value={editFormData.created_by || ""}
                        onChange={(e) => handleEditFormChange("created_by", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Updated By
                      </label>
                      <input
                        type="text"
                        value={editFormData.updated_by || ""}
                        onChange={(e) => handleEditFormChange("updated_by", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={saveStageData}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
