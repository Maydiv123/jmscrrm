"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function ReportsPage() {
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [jobsRes, usersRes] = await Promise.all([
        fetch(process.env.NEXT_PUBLIC_API_URL + "/api/pipeline/jobs", { credentials: "include" }),
        fetch(process.env.NEXT_PUBLIC_API_URL + "/api/users", { credentials: "include" })
      ]);

      if (jobsRes.status === 403 || usersRes.status === 403) {
        window.location.href = "/login";
        return;
      }

      if (jobsRes.ok && usersRes.ok) {
        const jobsData = await jobsRes.json();
        const usersData = await usersRes.json();
        setJobs(Array.isArray(jobsData) ? jobsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  const generateReport = () => {
    const reportData = {
      overview: generateOverviewReport(),
      performance: generatePerformanceReport(),
      stageAnalysis: generateStageAnalysisReport(),
      userActivity: generateUserActivityReport()
    };

    return reportData[selectedReport] || reportData.overview;
  };

  const generateOverviewReport = () => {
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(job => job.current_stage === 'completed').length;
    const activeJobs = jobs.filter(job => job.current_stage !== 'completed').length;
    const totalUsers = users.length;

    return {
      title: "Pipeline Overview Report",
      date: new Date().toLocaleDateString(),
      summary: {
        totalJobs,
        completedJobs,
        activeJobs,
        completionRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
        totalUsers
      },
      details: jobs.map(job => ({
        jobNo: job.job_no,
        stage: job.current_stage,
        status: job.status,
        created: new Date(job.created_at).toLocaleDateString(),
        consignee: job.stage1?.consignee || 'N/A'
      }))
    };
  };

  const generatePerformanceReport = () => {
    const userPerformance = users.filter(u => !u.is_admin).map(user => {
      const userJobs = jobs.filter(job => 
        job.created_by_user === user.username || 
        job.stage2_user_name === user.username || 
        job.stage3_user_name === user.username
      );
      const completedUserJobs = userJobs.filter(job => job.current_stage === 'completed');
      
      return {
        username: user.username,
        role: user.role,
        totalJobs: userJobs.length,
        completedJobs: completedUserJobs.length,
        completionRate: userJobs.length > 0 ? Math.round((completedUserJobs.length / userJobs.length) * 100) : 0
      };
    });

    return {
      title: "User Performance Report",
      date: new Date().toLocaleDateString(),
      summary: {
        totalUsers: userPerformance.length,
        averageCompletionRate: userPerformance.length > 0 ? 
          Math.round(userPerformance.reduce((sum, user) => sum + user.completionRate, 0) / userPerformance.length) : 0
      },
      details: userPerformance
    };
  };

  const generateStageAnalysisReport = () => {
    const stageDistribution = jobs.reduce((acc, job) => {
      acc[job.current_stage] = (acc[job.current_stage] || 0) + 1;
      return acc;
    }, {});

    const stageDetails = Object.entries(stageDistribution).map(([stage, count]) => ({
      stage,
      count,
      percentage: jobs.length > 0 ? Math.round((count / jobs.length) * 100) : 0
    }));

    return {
      title: "Stage Analysis Report",
      date: new Date().toLocaleDateString(),
      summary: {
        totalStages: Object.keys(stageDistribution).length,
        totalJobs: jobs.length
      },
      details: stageDetails
    };
  };

  const generateUserActivityReport = () => {
    const userActivity = users.map(user => {
      const userJobs = jobs.filter(job => 
        job.created_by_user === user.username || 
        job.stage2_user_name === user.username || 
        job.stage3_user_name === user.username
      );
      
      return {
        username: user.username,
        role: user.role,
        isAdmin: user.is_admin,
        totalJobs: userJobs.length,
        lastActivity: userJobs.length > 0 ? 
          new Date(Math.max(...userJobs.map(job => new Date(job.created_at)))).toLocaleDateString() : 'No activity'
      };
    });

    return {
      title: "User Activity Report",
      date: new Date().toLocaleDateString(),
      summary: {
        totalUsers: userActivity.length,
        activeUsers: userActivity.filter(user => user.totalJobs > 0).length
      },
      details: userActivity
    };
  };

  const exportReport = (format = 'json') => {
    const report = generateReport();
    
    if (format === 'json') {
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } else if (format === 'csv') {
      // Simple CSV export for overview report
      const csvContent = generateCSV(report);
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  };

  const generateCSV = (report) => {
    if (selectedReport === 'overview') {
      const headers = ['Job No', 'Stage', 'Status', 'Created', 'Consignee'];
      const rows = report.details.map(job => [
        job.jobNo,
        job.stage,
        job.status,
        job.created,
        job.consignee
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  const currentReport = generateReport();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole="admin" isAdmin={true} />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-2">
              Generate and export comprehensive reports
            </p>
          </div>

          {/* Report Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                  <select
                    value={selectedReport}
                    onChange={(e) => setSelectedReport(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="overview">Pipeline Overview</option>
                    <option value="performance">User Performance</option>
                    <option value="stageAnalysis">Stage Analysis</option>
                    <option value="userActivity">User Activity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportReport('json')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => exportReport('csv')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{currentReport.title}</h2>
              <p className="text-sm text-gray-600">Generated on {currentReport.date}</p>
            </div>
            
            <div className="p-6">
              {/* Report Summary */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(currentReport.summary).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Details */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {selectedReport === 'overview' && (
                          <>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Job No</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Consignee</th>
                          </>
                        )}
                        {selectedReport === 'performance' && (
                          <>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Jobs</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                          </>
                        )}
                        {selectedReport === 'stageAnalysis' && (
                          <>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                          </>
                        )}
                        {selectedReport === 'userActivity' && (
                          <>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Jobs</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentReport.details.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {selectedReport === 'overview' && (
                            <>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.jobNo}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.stage}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.status}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.created}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.consignee}</td>
                            </>
                          )}
                          {selectedReport === 'performance' && (
                            <>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.username}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.role}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.totalJobs}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.completedJobs}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.completionRate}%</td>
                            </>
                          )}
                          {selectedReport === 'stageAnalysis' && (
                            <>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.stage}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.count}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.percentage}%</td>
                            </>
                          )}
                          {selectedReport === 'userActivity' && (
                            <>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.username}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.role}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.totalJobs}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.lastActivity}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 