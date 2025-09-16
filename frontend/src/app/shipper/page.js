"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

export default function ShipperPage() {
  const [shippers, setShippers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingShipper, setEditingShipper] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchShippers();
  }, []);

  // Validation functions
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Company name is required';
        else if (value.length < 2) error = 'Company name must be at least 2 characters';
        else if (value.length > 100) error = 'Company name cannot exceed 100 characters';
        break;
      case 'address':
        if (value && value.length > 500) error = 'Address cannot exceed 500 characters';
        break;
      case 'phone':
        if (value && !/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(value)) {
          error = 'Please enter a valid phone number (10-15 digits)';
        }
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'status':
        if (!value) error = 'Status is required';
        else if (!['active', 'inactive'].includes(value)) {
          error = 'Invalid status selected';
        }
        break;
      default:
        break;
    }
    
    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchShippers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shippers`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setShippers(data);
    } catch (error) {
      console.log('API not available, using sample data');
      // Fallback to sample data
      setShippers([
        {
          id: 1,
          name: 'Ocean Shipping Lines',
          address: 'Port Authority, Mumbai',
          phone: '+91-22-12345678',
          email: 'info@oceanshipping.com',
          status: 'active'
        },
        {
          id: 2,
          name: 'Global Cargo Ltd.',
          address: 'Harbor Terminal, Chennai',
          phone: '+91-44-87654321',
          email: 'contact@globalcargo.com',
          status: 'active'
        },
        {
          id: 3,
          name: 'Maritime Logistics',
          address: 'Port Complex, Kolkata',
          phone: '+91-33-11223344',
          email: 'support@maritimelogistics.com',
          status: 'active'
        },
        {
          id: 4,
          name: 'International Freight',
          address: 'Container Terminal, Kochi',
          phone: '+91-484-55667788',
          email: 'info@intlfreight.com',
          status: 'active'
        }
      ]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const url = editingShipper 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/shippers/${editingShipper.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/shippers`;
      
      const method = editingShipper ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save shipper');
      }

      const savedShipper = await response.json();
      
      if (editingShipper) {
        setShippers(prev => prev.map(shipper => 
          shipper.id === editingShipper.id ? savedShipper : shipper
        ));
      } else {
        setShippers(prev => [savedShipper, ...prev]);
      }
      
      setShowModal(false);
      setEditingShipper(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        status: 'active'
      });
      setErrors({});
      
    } catch (error) {
      console.error('Error saving shipper:', error);
      alert('Error saving shipper: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (shipper) => {
    setEditingShipper(shipper);
    setFormData({
      name: shipper.name,
      address: shipper.address,
      phone: shipper.phone || '',
      email: shipper.email || '',
      status: shipper.status
    });
    setShowModal(true);
  };

  const handleDelete = async (shipper) => {
    if (!confirm(`Are you sure you want to delete ${shipper.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shippers/${shipper.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete shipper');
      }

      setShippers(prev => prev.filter(s => s.id !== shipper.id));
      
    } catch (error) {
      console.error('Error deleting shipper:', error);
      alert('Error deleting shipper: ' + error.message);
    }
  };

  const openModal = () => {
    setEditingShipper(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      status: 'active'
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingShipper(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      status: 'active'
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Shipper Management</h1>
            <p className="text-gray-600 mt-2">Manage all shipper information and details.</p>
          </div>

          <div className="mb-6">
            <button
              onClick={openModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              + Add New Shipper
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shippers.map((shipper) => (
              <div key={shipper.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{shipper.name}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    shipper.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {shipper.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Address:</strong> {shipper.address}</p>
                  {shipper.phone && <p><strong>Phone:</strong> {shipper.phone}</p>}
                  {shipper.email && <p><strong>Email:</strong> {shipper.email}</p>}
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleEdit(shipper)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(shipper)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {shippers.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <span className="text-6xl mb-4 block">🚢</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No shippers found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first shipper.</p>
              <button
                onClick={openModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
              >
                Add First Shipper
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingShipper ? 'Edit Shipper' : 'Add New Shipper'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md px-3 py-2 text-black ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter company name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  className={`w-full border rounded-md px-3 py-2 text-black ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter complete address"
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md px-3 py-2 text-black ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md px-3 py-2 text-black ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md px-3 py-2 text-black ${
                    errors.status ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingShipper ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
