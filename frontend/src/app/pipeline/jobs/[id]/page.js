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

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || "stage1_employee");
      setIsAdmin(user.is_admin || false);
    }
    fetchJobDetails();
  }, [fetchJobDetails]);
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
        console.log("Job details received:", data);
        console.log("Stage1 data:", data.stage1);
        console.log("Stage2 data:", data.stage2);
        console.log("Current stage:", data.current_stage);
        setJob(data);
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
  });

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
                  Stage 4: Billing & Completion
                </div>
                {job.stage4 && (
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
    </div>
  );
}
