"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Stage1Page() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

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

  useEffect(() => {
    // Check current user
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      console.log("Current user:", user);
      setUserRole(user.role || 'stage1_employee');
      setIsAdmin(user.is_admin || false);
    }
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      console.log("Fetching jobs for stage1 employee...");
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/myjobs`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Jobs fetched successfully:", data);
      
      // Filter jobs that are in stage1
      const stage1Jobs = data.filter(job => job.current_stage === 'stage1');
      setJobs(stage1Jobs);
      setFilteredJobs(stage1Jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStage = async (jobId, targetStage) => {
    if (!confirm(`Are you sure you want to advance this job to ${targetStage}?`)) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/jobs/${jobId}/advance-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ targetStage }),
      });

      if (res.ok) {
        alert("Job advanced successfully!");
        fetchJobs(); // Refresh the jobs list
      } else {
        const errorData = await res.json();
        alert(`Error advancing stage: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error advancing stage:", error);
      alert("Error advancing stage");
    }
  };

  const getStageDisplayName = (stage) => {
    const stageNames = {
      'stage1': 'Initial Setup',
      'stage2': 'Customs & Documentation',
      'stage3': 'Clearance & Dispatch',
      'stage4': 'Billing & Finalization',
      'completed': 'Completed'
    };
    return stageNames[stage] || stage;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stage 1: Initial Setup</h1>
              <p className="text-gray-600 mt-2">Process initial job setup and documentation</p>
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

          {/* Jobs List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Jobs Assigned to Me</h2>
            </div>
            
            {jobs.length === 0 ? (
              <div className="p-8 text-center">
                <span className="text-4xl mb-4 block">📋</span>
                <p className="text-gray-600">No jobs assigned to you yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        JOB NO.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        STAGE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CONSIGNEE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        COMMODITY
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        STATUS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {job.job_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getStageDisplayName(job.current_stage)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.stage1?.consignee || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.stage1?.commodity || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedJob(job)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleAdvanceStage(job.id, 'stage2')}
                              className="text-green-600 hover:text-green-900 transition-colors"
                            >
                              Advance to Stage 2
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

