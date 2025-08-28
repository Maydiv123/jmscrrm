"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

export default function ConsigneePage() {
  const [consignees, setConsignees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingConsignee, setEditingConsignee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    status: 'active'
  });

  useEffect(() => {
    fetchConsignees();
  }, []);

  const fetchConsignees = async () => {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/consignees", {
        credentials: "include"
      });
      
      if (res.ok) {
        const consigneesData = await res.json();
        setConsignees(Array.isArray(consigneesData) ? consigneesData : []);
      } else {
        console.error("Failed to fetch consignees:", res.status);
      }
    } catch (err) {
      console.error("Error fetching consignees:", err);
    }
  };

    const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingConsignee) {
        // Update existing consignee
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/api/consignees/${editingConsignee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          const updatedConsignee = await res.json();
          setConsignees(consignees.map(consignee =>
            consignee.id === editingConsignee.id ? updatedConsignee : consignee
          ));
        } else {
          const errorData = await res.text();
          alert('Error updating consignee: ' + errorData);
          return;
        }
      } else {
        // Add new consignee
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/consignees", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          const newConsignee = await res.json();
          setConsignees([...consignees, newConsignee]);
        } else {
          const errorData = await res.text();
          alert('Error creating consignee: ' + errorData);
          return;
        }
      }

      // Reset form and close modal
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        status: 'active'
      });
      setEditingConsignee(null);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving consignee:', err);
      alert('Error saving consignee');
    }
  };

  const handleEdit = (consignee) => {
    setEditingConsignee(consignee);
    setFormData({
      name: consignee.name,
      address: consignee.address,
      phone: consignee.phone,
      email: consignee.email,
      status: consignee.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this consignee?')) {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/api/consignees/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (res.ok) {
          setConsignees(consignees.filter(consignee => consignee.id !== id));
        } else {
          const errorData = await res.text();
          alert('Error deleting consignee: ' + errorData);
        }
      } catch (err) {
        console.error('Error deleting consignee:', err);
        alert('Error deleting consignee');
      }
    }
  };

  const openAddModal = () => {
    setEditingConsignee(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole="admin" isAdmin={true} />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Consignee Management</h1>
            <p className="text-gray-600 mt-2">Manage all consignee information and details</p>
          </div>

          {/* Add Button */}
          <div className="mb-6">
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add New Consignee
            </button>
          </div>

          {/* Consignee Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {consignees.map((consignee) => (
              <div key={consignee.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{consignee.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(consignee.status)}`}>
                    {consignee.status.charAt(0).toUpperCase() + consignee.status.slice(1)}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Address:</span> {consignee.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {consignee.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {consignee.email}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(consignee)}
                    className="flex-1 px-3 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(consignee.id)}
                    className="flex-1 px-3 py-2 text-red-600 hover:text-red-700 text-sm font-medium border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {consignees.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">🏢</span>
              <p className="text-gray-600 text-lg">No consignees found</p>
              <p className="text-gray-500">Start by adding your first consignee</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingConsignee ? 'Edit Consignee' : 'Add New Consignee'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingConsignee ? 'Update Consignee' : 'Add Consignee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
