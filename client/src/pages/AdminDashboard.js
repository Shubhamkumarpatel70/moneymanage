import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FiLogOut, FiUsers, FiDollarSign, FiX, FiCreditCard, FiEdit2, FiTrash2, FiUserX, FiCheck, FiXCircle, FiEye, FiPhone } from 'react-icons/fi';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [contactPermissions, setContactPermissions] = useState([]);
  const [viewingContacts, setViewingContacts] = useState(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [editPaymentMethodForm, setEditPaymentMethodForm] = useState({
    upiId: '',
    qrCode: '',
    label: '',
    isDefault: false
  });
  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [qrCodePreview, setQrCodePreview] = useState('');
  const [viewingImage, setViewingImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'transactions') {
      fetchAllTransactions();
    } else if (activeTab === 'payments') {
      fetchAllPayments();
    } else if (activeTab === 'payment-methods') {
      fetchAllPaymentMethods();
    } else if (activeTab === 'deletion-requests') {
      fetchDeletionRequests();
    } else if (activeTab === 'contact-permissions') {
      fetchContactPermissions();
    }
  }, [activeTab, user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/auth/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert(error.response?.data?.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/transactions/admin/all');
      setTransactions(res.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert(error.response?.data?.message || 'Error fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/payments/admin/all');
      setPayments(res.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      alert(error.response?.data?.message || 'Error fetching payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPaymentMethods = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/payment-methods/admin/all');
      setPaymentMethods(res.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      alert(error.response?.data?.message || 'Error fetching payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleQrCodeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setQrCodeFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setQrCodePreview(base64String);
        setEditPaymentMethodForm({ ...editPaymentMethodForm, qrCode: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditPaymentMethod = (method) => {
    setEditingPaymentMethod(method);
    setEditPaymentMethodForm({
      upiId: method.upiId || '',
      qrCode: method.qrCode || '',
      label: method.label || '',
      isDefault: method.isDefault || false
    });
    if (method.qrCode) {
      setQrCodePreview(method.qrCode);
    }
  };

  const handleUpdatePaymentMethod = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/payment-methods/${editingPaymentMethod._id}`, editPaymentMethodForm);
      await fetchAllPaymentMethods();
      setEditingPaymentMethod(null);
      setEditPaymentMethodForm({ upiId: '', qrCode: '', label: '', isDefault: false });
      setQrCodeFile(null);
      setQrCodePreview('');
      alert('Payment method updated successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating payment method');
    }
  };

  const handleDeletePaymentMethod = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) {
      return;
    }
    try {
      await axios.delete(`/api/payment-methods/${id}`);
      await fetchAllPaymentMethods();
      alert('Payment method deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting payment method');
    }
  };

  const fetchDeletionRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/auth/deletion-requests');
      setDeletionRequests(res.data);
    } catch (error) {
      console.error('Error fetching deletion requests:', error);
      alert(error.response?.data?.message || 'Error fetching deletion requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDeletion = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this account deletion? This will permanently delete the user and all their data.')) {
      return;
    }
    try {
      await axios.post(`/api/auth/deletion-requests/${requestId}/approve`);
      await fetchDeletionRequests();
      alert('Account deletion approved and account deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving deletion request');
    }
  };

  const handleRejectDeletion = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this account deletion request?')) {
      return;
    }
    try {
      await axios.post(`/api/auth/deletion-requests/${requestId}/reject`);
      await fetchDeletionRequests();
      alert('Account deletion request rejected');
    } catch (error) {
      alert(error.response?.data?.message || 'Error rejecting deletion request');
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      await axios.post(`/api/payments/${paymentId}/approve`);
      await fetchAllPayments();
      alert('Payment approved successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving payment');
    }
  };

  const handleRejectPayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to reject this payment?')) {
      return;
    }
    try {
      await axios.post(`/api/payments/${paymentId}/reject`);
      await fetchAllPayments();
      alert('Payment rejected');
    } catch (error) {
      alert(error.response?.data?.message || 'Error rejecting payment');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">{user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <FiLogOut />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 min-w-[150px] py-4 px-6 text-center font-medium transition ${
                activeTab === 'users'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiUsers />
                <span>Manage Users</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 min-w-[150px] py-4 px-6 text-center font-medium transition ${
                activeTab === 'transactions'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiDollarSign />
                <span>Manage Transactions</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 min-w-[150px] py-4 px-6 text-center font-medium transition ${
                activeTab === 'payments'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiCreditCard />
                <span>Payment Info</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payment-methods')}
              className={`flex-1 min-w-[150px] py-4 px-6 text-center font-medium transition ${
                activeTab === 'payment-methods'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiCreditCard />
                <span>Payment Methods</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('contact-permissions')}
              className={`flex-1 min-w-[150px] py-4 px-6 text-center font-medium transition ${
                activeTab === 'contact-permissions'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiPhone />
                <span>Contact Permissions</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('deletion-requests')}
              className={`flex-1 min-w-[150px] py-4 px-6 text-center font-medium transition ${
                activeTab === 'deletion-requests'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiUserX />
                <span>Deletion Requests</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : activeTab === 'users' ? (
            <div>
              <div className="px-4 md:px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">All Users</h2>
              </div>
              {users.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No users found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-gray-50">
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.phone}</td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email || '-'}</td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'transactions' ? (
            <div>
              <div className="px-4 md:px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">All Transactions</h2>
              </div>
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No transactions found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((t) => (
                        <tr key={t._id} className="hover:bg-gray-50">
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {t.userId?.name || 'N/A'}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {t.customerId?.name || 'N/A'}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              t.type === 'received' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {t.type === 'received' ? 'Received' : 'Given'}
                            </span>
                          </td>
                          <td className={`px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            t.type === 'received' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(t.amount)}
                          </td>
                          <td className={`px-4 md:px-6 py-4 whitespace-nowrap text-sm ${
                            t.balance >= 0 ? 'text-indigo-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(t.balance)}
                          </td>
                          <td className="px-4 md:px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {t.description || '-'}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(t.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'payments' ? (
            <div>
              <div className="px-4 md:px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">All Payments</h2>
              </div>
              {payments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No payments found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payer</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proof</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment._id} className="hover:bg-gray-50">
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.createdAt)}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.userId?.name || 'N/A'}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.payerPhoneNumber}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                payment.paymentMethodType === 'upi' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {payment.paymentMethodType === 'upi' ? 'UPI' : 'QR'}
                              </span>
                              {payment.paymentMethodDetails?.label && (
                                <span className="text-xs text-gray-600">{payment.paymentMethodDetails.label}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            {payment.paymentProof ? (
                              <div className="flex items-center gap-2">
                                <img 
                                  src={payment.paymentProof} 
                                  alt="Payment Proof" 
                                  className="w-10 h-10 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 transition"
                                  onClick={() => setViewingImage(payment.paymentProof)}
                                />
                                <button
                                  onClick={() => setViewingImage(payment.paymentProof)}
                                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                                >
                                  <FiEye />
                                  <span className="hidden sm:inline">View</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                            {payment.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprovePayment(payment._id)}
                                  className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                                  title="Approve"
                                >
                                  <FiCheck className="text-sm" />
                                </button>
                                <button
                                  onClick={() => handleRejectPayment(payment._id)}
                                  className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                  title="Reject"
                                >
                                  <FiXCircle className="text-sm" />
                                </button>
                              </div>
                            )}
                            {payment.status !== 'pending' && (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'payment-methods' ? (
            <div>
              <div className="px-4 md:px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">All Payment Methods</h2>
              </div>
              
              {/* Edit Payment Method Modal */}
              {editingPaymentMethod && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Edit Payment Method</h3>
                      <button
                        onClick={() => {
                          setEditingPaymentMethod(null);
                          setEditPaymentMethodForm({ upiId: '', qrCode: '', label: '', isDefault: false });
                          setQrCodeFile(null);
                          setQrCodePreview('');
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <FiX className="text-xl" />
                      </button>
                    </div>
                    <form onSubmit={handleUpdatePaymentMethod} className="space-y-4">
                      {editingPaymentMethod.type === 'upi' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                          <input
                            type="text"
                            value={editPaymentMethodForm.upiId}
                            onChange={(e) => setEditPaymentMethodForm({ ...editPaymentMethodForm, upiId: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">QR Code</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQrCodeUpload}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          />
                          {qrCodePreview && (
                            <div className="mt-2">
                              <img src={qrCodePreview} alt="QR Code Preview" className="max-w-xs h-auto border border-gray-300 rounded-lg" />
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                        <input
                          type="text"
                          value={editPaymentMethodForm.label}
                          onChange={(e) => setEditPaymentMethodForm({ ...editPaymentMethodForm, label: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editPaymentMethodForm.isDefault}
                          onChange={(e) => setEditPaymentMethodForm({ ...editPaymentMethodForm, isDefault: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <label className="text-sm text-gray-700">Set as default</label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPaymentMethod(null);
                            setEditPaymentMethodForm({ upiId: '', qrCode: '', label: '', isDefault: false });
                            setQrCodeFile(null);
                            setQrCodePreview('');
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {paymentMethods.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No payment methods found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentMethods.map((method) => (
                        <tr key={method._id} className="hover:bg-gray-50">
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {method.userId?.name || 'N/A'}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              method.type === 'upi' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {method.type === 'upi' ? 'UPI' : 'QR Code'}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-sm text-gray-500">
                            {method.type === 'upi' ? (
                              <span>{method.upiId}</span>
                            ) : (
                              method.qrCode ? (
                                <img src={method.qrCode} alt="QR Code" className="max-w-[100px] h-auto border border-gray-300 rounded" />
                              ) : (
                                <span>-</span>
                              )
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {method.label || '-'}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            {method.isDefault ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                Default
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditPaymentMethod(method)}
                                className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                                title="Edit"
                              >
                                <FiEdit2 className="text-sm" />
                              </button>
                              <button
                                onClick={() => handleDeletePaymentMethod(method._id)}
                                className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                title="Delete"
                              >
                                <FiTrash2 className="text-sm" />
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
          ) : activeTab === 'contact-permissions' ? (
            <div>
              <div className="px-4 md:px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Contact Permissions</h2>
              </div>
              {contactPermissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No contact permissions found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Permission</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacts Count</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Accessed</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contactPermissions.map((permission) => (
                        <tr key={permission._id} className="hover:bg-gray-50">
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {permission.userId?.name || 'N/A'}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {permission.userId?.email || '-'}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              permission.permissionGranted 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {permission.permissionGranted ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {permission.contacts?.length || 0}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {permission.lastAccessed 
                              ? new Date(permission.lastAccessed).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '-'}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                            {permission.permissionGranted && permission.contacts?.length > 0 ? (
                              <button
                                onClick={() => setViewingContacts(permission)}
                                className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition flex items-center gap-1"
                                title="View Contacts"
                              >
                                <FiEye className="text-sm" />
                                <span className="hidden sm:inline text-xs">View</span>
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">No contacts</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="px-4 md:px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Account Deletion Requests</h2>
              </div>
              {deletionRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No deletion requests found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Date</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processed By</th>
                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {deletionRequests.map((request) => (
                        <tr key={request._id} className="hover:bg-gray-50">
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {request.userId?.name || 'N/A'}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.userId?.phone || 'N/A'}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.userId?.email || '-'}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(request.createdAt)}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.processedBy?.name || '-'}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                            {request.status === 'pending' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveDeletion(request._id)}
                                  className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-1"
                                  title="Approve"
                                >
                                  <FiCheck className="text-sm" />
                                  <span className="hidden sm:inline text-xs">Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRejectDeletion(request._id)}
                                  className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center gap-1"
                                  title="Reject"
                                >
                                  <FiXCircle className="text-sm" />
                                  <span className="hidden sm:inline text-xs">Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image View Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10"
            >
              <FiX className="text-xl text-gray-700" />
            </button>
            <img 
              src={viewingImage} 
              alt="Payment Proof" 
              className="w-full h-auto rounded-lg shadow-2xl max-h-[90vh] object-contain bg-white"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

