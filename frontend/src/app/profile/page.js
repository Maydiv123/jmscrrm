"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function ProfilePage() {
  const [userRole, setUserRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || 'stage1_employee');
      setIsAdmin(user.is_admin || false);
      setUserData(user);
    }
    setLoading(false);
  }, []);

  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'stage1_employee': return 'Stage 1 Employee';
      case 'stage2_employee': return 'Stage 2 Employee';
      case 'stage3_employee': return 'Stage 3 Employee';
      case 'customer': return 'Customer';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-2">
              Your account information and settings
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-2xl">
                  {userData?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{userData?.username || 'User'}</h2>
                <p className="text-gray-600">{getRoleName(userData?.role)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <span className="text-gray-900">{userData?.username || 'N/A'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <span className="text-gray-900">{getRoleName(userData?.role)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <span className="text-gray-900">{userData?.designation || 'N/A'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    userData?.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {userData?.is_admin ? 'Administrator' : 'Standard User'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Created</span>
                  <span className="text-gray-900">Recently</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Login</span>
                  <span className="text-gray-900">Today</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-2xl mr-3">🔒</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Change Password</p>
                    <p className="text-sm text-gray-600">Update your password</p>
                  </div>
                </button>

                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-2xl mr-3">⚙️</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Settings</p>
                    <p className="text-sm text-gray-600">Manage preferences</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 