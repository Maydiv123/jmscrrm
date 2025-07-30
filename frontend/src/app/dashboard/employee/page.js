"use client";
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Link from "next/link";

export default function EmployeeDashboard() {
  const [userRole, setUserRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    thisMonthJobs: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    checkUserRole();
    fetchDashboardData();
  }, []);

  async function checkUserRole() {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role || 'stage1_employee');
        setIsAdmin(user.is_admin || false);
        
        // Redirect subadmin to subadmin dashboard
        if (user.role === 'subadmin') {
          console.log("Subadmin detected in employee dashboard - redirecting to subadmin dashboard");
          window.location.href = "/dashboard/subadmin";
          return;
        }
      }
    } catch (err) {
      console.error("Error checking user role:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDashboardData() {
    try {
      // Get user info from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.log("No user data found - redirecting to login");
        window.location.href = "/login";
        return;
      }
      
      const user = JSON.parse(userData);
      console.log("Current user for dashboard:", user);

      // Fetch jobs assigned to this specific user
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/pipeline/myjobs", {
        credentials: "include"
      });

      console.log("Dashboard fetch response status:", res.status);

      if (res.status === 401) {
        console.log("Session expired - redirecting to login");
        window.location.href = "/login";
        return;
      }

      if (res.ok) {
        const jobs = await res.json();
        console.log("Dashboard received jobs:", jobs);
        const jobsArray = Array.isArray(jobs) ? jobs : [];
        
        // Calculate statistics
        const totalJobs = jobsArray.length;
        const completedJobs = jobsArray.filter(job => job.current_stage === 'completed').length;
        const pendingJobs = jobsArray.filter(job => job.current_stage !== 'completed').length;
        const thisMonthJobs = jobsArray.filter(job => {
          const jobDate = new Date(job.created_at);
          const now = new Date();
          return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear();
        }).length;

        console.log("Calculated stats:", { totalJobs, completedJobs, pendingJobs, thisMonthJobs });

        setStats({ totalJobs, completedJobs, pendingJobs, thisMonthJobs });
        setRecentJobs(jobsArray.slice(0, 5)); // Get latest 5 jobs
      } else {
        const errorText = await res.text();
        console.error("Error fetching dashboard data:", errorText);
        setStats({ totalJobs: 0, completedJobs: 0, pendingJobs: 0, thisMonthJobs: 0 });
        setRecentJobs([]);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setStats({ totalJobs: 0, completedJobs: 0, pendingJobs: 0, thisMonthJobs: 0 });
      setRecentJobs([]);
    }
  }

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
      case 'stage2': return 'Customs & Documentation';
      case 'stage3': return 'Clearance & Logistics';
      case 'stage4': return 'Billing & Completion';
      case 'completed': return 'Completed';
      default: return stage;
    }
  };

  const getTaskPage = (role) => {
    switch (role) {
      case 'stage2_employee': return "/stage2";
      case 'stage3_employee': return "/stage3";
      case 'customer': return "/stage4";
      default: return "/pipeline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your tasks today
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedJobs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingJobs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <span className="text-2xl">📅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisMonthJobs}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href={getTaskPage(userRole)}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <p className="font-medium text-gray-900">My Tasks</p>
                  <p className="text-sm text-gray-600">View and update your assigned jobs</p>
                </div>
              </Link>

              <Link
                href="/pipeline"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">🔄</span>
                <div>
                  <p className="font-medium text-gray-900">Pipeline</p>
                  <p className="text-sm text-gray-600">View all jobs in the pipeline</p>
                </div>
              </Link>

              <Link
                href="/profile"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">👤</span>
                <div>
                  <p className="font-medium text-gray-900">Profile</p>
                  <p className="text-sm text-gray-600">Update your profile information</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Jobs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
              <Link
                href="/pipeline"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all →
              </Link>
            </div>

            {recentJobs.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">📋</span>
                <p className="text-gray-600">No jobs assigned yet</p>
                <p className="text-sm text-gray-500 mt-1">Jobs will appear here once assigned</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">J</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{job.job_no}</p>
                        <p className="text-sm text-gray-600">
                          {job.stage1?.consignee || 'No consignee'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(job.current_stage)}`}>
                        {getStageName(job.current_stage)}
                      </span>
                      <Link
                        href={`/pipeline/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 