"use client";
import { use, useCallback, useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Link from "next/link";

export default function SubadminDashboard() {
  const [users, setUsers] = useState([]);
  const [pipelineJobs, setPipelineJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState({
    totalJobs: 0,
    completedJobs: 0,
    activeJobs: 0,
    totalUsers: 0,
    stageDistribution: {},
    monthlyJobs: [],
    recentActivity: [],
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const fetchData = useCallback(async () => {
    try {
      const [usersRes, pipelineRes] = await Promise.all([
        fetch(process.env.NEXT_PUBLIC_API_URL + "/api/users", {
          credentials: "include",
        }),
        fetch(process.env.NEXT_PUBLIC_API_URL + "/api/pipeline/jobs", {
          credentials: "include",
        }),
      ]);

      if (usersRes.status === 403 || pipelineRes.status === 403) {
        window.location.href = "/login";
        return;
      }

      if (!usersRes.ok) throw new Error("Failed to fetch data");

      const usersData = await usersRes.json();
      const usersArray = Array.isArray(usersData) ? usersData : [];
      setUsers(usersArray);

      if (pipelineRes.ok) {
        const pipelineData = await pipelineRes.json();
        const jobsArray = Array.isArray(pipelineData) ? pipelineData : [];
        setPipelineJobs(jobsArray);

        // Calculate analytics
        calculateAnalytics(jobsArray, usersArray);
      }
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  },[]);

  function calculateAnalytics(jobs, users) {
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(
      (job) => job.current_stage === "completed"
    ).length;
    const activeJobs = jobs.filter(
      (job) => job.current_stage !== "completed"
    ).length;
    const totalUsers = users.length;

    // Stage distribution
    const stageDistribution = jobs.reduce((acc, job) => {
      acc[job.current_stage] = (acc[job.current_stage] || 0) + 1;
      return acc;
    }, {});

    // Monthly jobs (last 6 months)
    const monthlyJobs = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString("default", { month: "short" });
      const count = jobs.filter((job) => {
        const jobDate = new Date(job.created_at);
        return (
          jobDate.getMonth() === date.getMonth() &&
          jobDate.getFullYear() === date.getFullYear()
        );
      }).length;
      monthlyJobs.push({ month, count });
    }

    // Recent activity (last 10 jobs)
    const recentActivity = jobs
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    setAnalytics({
      totalJobs,
      completedJobs,
      activeJobs,
      totalUsers,
      stageDistribution,
      monthlyJobs,
      recentActivity,
    });
  }

  const getStageColor = (stage) => {
    switch (stage) {
      case "stage1":
        return "bg-blue-100 text-blue-800";
      case "stage2":
        return "bg-yellow-100 text-yellow-800";
      case "stage3":
        return "bg-green-100 text-green-800";
      case "stage4":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStageName = (stage) => {
    switch (stage) {
      case "stage1":
        return "Stage 1";
      case "stage2":
        return "Stage 2";
      case "stage3":
        return "Stage 3";
      case "stage4":
        return "Stage 4";
      case "completed":
        return "Completed";
      default:
        return stage;
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "subadmin":
        return "Subadmin";
      case "stage1_employee":
        return "Stage 1 Employee";
      case "stage2_employee":
        return "Stage 2 Employee";
      case "stage3_employee":
        return "Stage 3 Employee";
      case "customer":
        return "Customer";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subadmin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole="subadmin" isAdmin={false} />

      <div className="flex-1 ml-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Subadmin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              {" Overview of your organization's pipeline and user activity"}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Jobs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalJobs}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.completedJobs}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.activeJobs}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Team Members
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalUsers}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Stage Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Stage Distribution
              </h2>
              <div className="space-y-3">
                {Object.entries(analytics.stageDistribution).map(
                  ([stage, count]) => (
                    <div
                      key={stage}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(
                            stage
                          )}`}
                        >
                          {getStageName(stage)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(count / analytics.totalJobs) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {count}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Monthly Jobs Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Monthly Jobs
              </h2>
              <div className="flex items-end justify-between h-32">
                {analytics.monthlyJobs.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className="bg-blue-600 rounded-t w-8 mb-2"
                      style={{
                        height: `${
                          (item.count /
                            Math.max(
                              ...analytics.monthlyJobs.map((m) => m.count),
                              1
                            )) *
                          80
                        }px`,
                      }}
                    ></div>
                    <span className="text-xs text-gray-600">{item.month}</span>
                    <span className="text-xs font-medium text-gray-900">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link
                href="/pipeline"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">🔄</span>
                <div>
                  <p className="font-medium text-gray-900">Pipeline</p>
                  <p className="text-sm text-gray-600">Manage all jobs</p>
                </div>
              </Link>

              <Link
                href="/tasks"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <p className="font-medium text-gray-900">Tasks</p>
                  <p className="text-sm text-gray-600">Manage tasks</p>
                </div>
              </Link>

              <Link
                href="/users"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">👥</span>
                <div>
                  <p className="font-medium text-gray-900">Team</p>
                  <p className="text-sm text-gray-600">View members</p>
                </div>
              </Link>

              <Link
                href="/profile"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">👤</span>
                <div>
                  <p className="font-medium text-gray-900">Profile</p>
                  <p className="text-sm text-gray-600">Manage account</p>
                </div>
              </Link>
            </div>
          </div> */}

          {/* Recent Activity and Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h2>
                <Link
                  href="/pipeline"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all →
                </Link>
              </div>

              {analytics.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">📋</span>
                  <p className="text-gray-600">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.recentActivity.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            J
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {job.job_no}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(job.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(
                          job.current_stage
                        )}`}
                      >
                        {getStageName(job.current_stage)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Users Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Team Members
                </h2>
                <Link
                  href="/users"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all →
                </Link>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">👥</span>
                  <p className="text-gray-600">No users found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.username}
                          </p>
                          <p className="text-sm text-gray-600">
                            {getRoleName(user.role)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === "subadmin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role === "subadmin" ? "Subadmin" : "User"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
