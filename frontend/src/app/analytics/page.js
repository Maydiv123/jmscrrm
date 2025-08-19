"use client";
import { useEffect, useState , useCallback} from "react";
import Sidebar from "../components/Sidebar";

export default function AnalyticsPage() {
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalJobs: 0,
    completedJobs: 0,
    activeJobs: 0,
    totalUsers: 0,
    stageDistribution: {},
    monthlyJobs: [],
    weeklyJobs: [],
    userPerformance: [],
    averageCompletionTime: 0,
    topPerformingUsers: []
  });

  const fetchAnalyticsData = useCallback(async () => {
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
        const jobsArray = Array.isArray(jobsData) ? jobsData : [];
        const usersArray = Array.isArray(usersData) ? usersData : [];

        setJobs(jobsArray);
        setUsers(usersArray);
        calculateAnalytics(jobsArray, usersArray);
      }
    } catch (err) {
      console.error("Error fetching analytics data:", err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this never changes

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]); // Now stable because of useCallback

  function calculateAnalytics(jobs, users) {
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(job => job.current_stage === 'completed').length;
    const activeJobs = jobs.filter(job => job.current_stage !== 'completed').length;
    const totalUsers = users.length;

    // Stage distribution
    const stageDistribution = jobs.reduce((acc, job) => {
      acc[job.current_stage] = (acc[job.current_stage] || 0) + 1;
      return acc;
    }, {});

    // Monthly jobs (last 12 months)
    const monthlyJobs = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      const count = jobs.filter(job => {
        const jobDate = new Date(job.created_at);
        return jobDate.getMonth() === date.getMonth() && jobDate.getFullYear() === date.getFullYear();
      }).length;
      monthlyJobs.push({ month, count });
    }

    // Weekly jobs (last 8 weeks)
    const weeklyJobs = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const week = `Week ${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
      const count = jobs.filter(job => {
        const jobDate = new Date(job.created_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return jobDate >= weekStart && jobDate <= weekEnd;
      }).length;
      weeklyJobs.push({ week, count });
    }

    // User performance
    const userPerformance = users.filter(u => !u.is_admin).map(user => {
      const userJobs = jobs.filter(job => 
        job.created_by_user === user.username || 
        job.stage2_user_name === user.username || 
        job.stage3_user_name === user.username
      );
      const completedUserJobs = userJobs.filter(job => job.current_stage === 'completed');
      return {
        username: user.username,
        totalJobs: userJobs.length,
        completedJobs: completedUserJobs.length,
        completionRate: userJobs.length > 0 ? Math.round((completedUserJobs.length / userJobs.length) * 100) : 0
      };
    });

    // Top performing users
    const topPerformingUsers = userPerformance
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);

    // Average completion time (simplified calculation)
    const averageCompletionTime = completedJobs > 0 ? Math.round(totalJobs / completedJobs) : 0;

    setAnalytics({
      totalJobs,
      completedJobs,
      activeJobs,
      totalUsers,
      stageDistribution,
      monthlyJobs,
      weeklyJobs,
      userPerformance,
      averageCompletionTime,
      topPerformingUsers
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole="admin" isAdmin={true} />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive insights and performance metrics
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
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalJobs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalJobs > 0 ? Math.round((analytics.completedJobs / analytics.totalJobs) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.averageCompletionTime} days</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Jobs Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Job Trends</h2>
              <div className="flex items-end justify-between h-48">
                {analytics.monthlyJobs.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="bg-blue-600 rounded-t w-6 mb-2"
                      style={{ height: `${(item.count / Math.max(...analytics.monthlyJobs.map(m => m.count))) * 120}px` }}
                    ></div>
                    <span className="text-xs text-gray-600">{item.month}</span>
                    <span className="text-xs font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Jobs Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Job Activity</h2>
              <div className="flex items-end justify-between h-48">
                {analytics.weeklyJobs.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="bg-green-600 rounded-t w-6 mb-2"
                      style={{ height: `${(item.count / Math.max(...analytics.weeklyJobs.map(w => w.count))) * 120}px` }}
                    ></div>
                    <span className="text-xs text-gray-600">{item.week}</span>
                    <span className="text-xs font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stage Distribution and Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Stage Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Stage Distribution</h2>
              <div className="space-y-3">
                {Object.entries(analytics.stageDistribution).map(([stage, count]) => (
                  <div key={stage} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(stage)}`}>
                        {getStageName(stage)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / analytics.totalJobs) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Users */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Users</h2>
              {analytics.topPerformingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">🏆</span>
                  <p className="text-gray-600">No performance data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.topPerformingUsers.map((user, index) => (
                    <div key={user.username} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.username}</p>
                          <p className="text-sm text-gray-600">{user.completedJobs}/{user.totalJobs} jobs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{user.completionRate}%</p>
                        <p className="text-xs text-gray-500">Completion Rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detailed Performance Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">User Performance Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Jobs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.userPerformance.map((user) => (
                    <tr key={user.username} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.totalJobs}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.completedJobs}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.completionRate}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                user.completionRate >= 80 ? 'bg-green-500' :
                                user.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${user.completionRate}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-medium ${
                            user.completionRate >= 80 ? 'text-green-600' :
                            user.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {user.completionRate >= 80 ? 'Excellent' :
                             user.completionRate >= 60 ? 'Good' : 'Needs Improvement'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 