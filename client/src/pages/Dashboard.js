import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiPlus, FiLogOut, FiUser, FiSettings, FiHome, FiCreditCard, FiUser as FiUserIcon, FiUsers, FiTrash2, FiEdit2, FiX, FiImage, FiDollarSign, FiGlobe, FiEye, FiCheck, FiXCircle, FiSearch, FiPhone, FiSmartphone } from 'react-icons/fi';

const Dashboard = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('home');
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    totalReceived: 0,
    totalGiven: 0,
    currentBalance: 0
  });
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', mobile: '' });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactPermissionGranted, setContactPermissionGranted] = useState(() => {
    // Check if permission was previously granted
    return localStorage.getItem('contactPermissionGranted') === 'true';
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
    fetchSummary();
    
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }
    
    // Listen for the beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/api/customers');
      setCustomers(res.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get('/api/transactions/summary');
      setSummary(res.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handlePickContact = async () => {
    try {
      // Check if permission was previously granted
      if (!contactPermissionGranted) {
        // Ask for permission only if not previously granted
        const permissionGranted = window.confirm(
          'This app would like to access your contacts to help you add customers quickly. Do you want to continue?'
        );

        if (!permissionGranted) {
          // User denied permission - store this so we ask again next time
          localStorage.setItem('contactPermissionGranted', 'false');
          setContactPermissionGranted(false);
          alert('Okay. You can still enter customer details manually.');
          return;
        } else {
          // User granted permission - store this so we don't ask again
          localStorage.setItem('contactPermissionGranted', 'true');
          setContactPermissionGranted(true);
          
          // Save permission grant to backend
          try {
            await axios.post('/api/auth/contact-permission', {
              permissionGranted: true
            });
          } catch (err) {
            console.error('Error saving contact permission:', err);
            // Don't block the user if saving fails
          }
        }
      }

      // Check if Contact Picker API is available (Chrome/Edge on Android)
      if ('contacts' in navigator && 'select' in navigator.contacts) {
        try {
          // Use Contact Picker API to select contact
          const selectedContacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
          if (selectedContacts && selectedContacts.length > 0) {
            const contact = selectedContacts[0];
            const name = contact.name?.[0] || '';
            const phone = contact.tel?.[0] || '';
            const cleanedPhone = phone.replace(/\D/g, ''); // Remove non-digits
            
            setNewCustomer({ 
              name: name, 
              mobile: cleanedPhone
            });
            
            // Save contact permission and contact to backend
            try {
              await axios.post('/api/auth/contact-permission', {
                permissionGranted: true,
                contact: {
                  name: name,
                  phone: cleanedPhone
                }
              });
            } catch (err) {
              console.error('Error saving contact permission:', err);
              // Don't block the user if saving fails
            }
          }
        } catch (err) {
          if (err.name === 'AbortError') {
            // User cancelled the contact picker
            return;
          }
          console.error('Error accessing contacts:', err);
          // If error accessing, reset permission so we ask again next time
          localStorage.setItem('contactPermissionGranted', 'false');
          setContactPermissionGranted(false);
          
          // Update backend that permission was denied
          try {
            await axios.post('/api/auth/contact-permission', {
              permissionGranted: false
            });
          } catch (backendErr) {
            console.error('Error updating contact permission:', backendErr);
          }
          
          alert('Failed to access contacts. Please enter manually.');
        }
      } else {
        // Fallback for browsers that don't support Contact Picker API
        alert('Contact picker is not supported in this browser. Please enter customer details manually.');
      }
    } catch (error) {
      console.error('Error picking contact:', error);
      // Reset permission on error so we ask again next time
      localStorage.setItem('contactPermissionGranted', 'false');
      setContactPermissionGranted(false);
      alert('Failed to access contacts. Please enter manually.');
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/customers', newCustomer);
      setCustomers([res.data, ...customers]);
      setNewCustomer({ name: '', mobile: '' });
      setShowAddCustomer(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding customer');
    }
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.mobile.includes(query)
    );
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // For iOS Safari, show instructions
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        alert('To install this app on your iOS device:\n1. Tap the Share button\n2. Tap "Add to Home Screen"');
        return;
      }
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              <FiUser />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-800">Money Management</h1>
              <p className="text-xs md:text-sm text-gray-500">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isInstalled && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition"
                title="Download App"
              >
                <FiSmartphone />
                <span className="hidden sm:inline">Download App</span>
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-3 md:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Admin Dashboard"
              >
                <FiSettings className="text-lg" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 md:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <FiLogOut />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-4 md:mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex-1 min-w-[100px] py-3 md:py-4 px-4 md:px-6 text-center font-medium transition ${
                activeTab === 'home'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiHome />
                <span className="text-sm md:text-base">Home</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 min-w-[100px] py-3 md:py-4 px-4 md:px-6 text-center font-medium transition ${
                activeTab === 'payments'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiDollarSign />
                <span className="text-sm md:text-base">Payments</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 min-w-[100px] py-3 md:py-4 px-4 md:px-6 text-center font-medium transition ${
                activeTab === 'settings'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiSettings />
                <span className="text-sm md:text-base">Settings</span>
              </div>
            </button>
          </div>
        </div>

        {/* Home Tab Content */}
        {activeTab === 'home' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-green-500">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Total Received</p>
            <p className="text-xl md:text-2xl font-bold text-green-600">{formatCurrency(summary.totalReceived)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-red-500">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Total Given</p>
            <p className="text-xl md:text-2xl font-bold text-red-600">{formatCurrency(summary.totalGiven)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-indigo-500">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Current Balance</p>
            <p className={`text-xl md:text-2xl font-bold ${summary.currentBalance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
              {formatCurrency(summary.currentBalance)}
            </p>
          </div>
        </div>

        {/* Add Customer Button */}
        <div className="mb-4 md:mb-6">
          <button
            onClick={() => setShowAddCustomer(!showAddCustomer)}
            className="w-full bg-indigo-600 text-white py-3 md:py-4 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg text-sm md:text-base"
          >
            <FiPlus className="text-lg md:text-xl" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Add Customer Form */}
        {showAddCustomer && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-800">Add New Customer</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={newCustomer.mobile}
                    onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value.replace(/\D/g, '') })}
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="Enter mobile number"
                  />
                  <button
                    type="button"
                    onClick={handlePickContact}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-2"
                    title="Pick from contacts"
                  >
                    <FiPhone className="text-lg" />
                    <span className="hidden sm:inline">Contacts</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Click Contacts button to import from your phone</p>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Add Customer
              </button>
            </form>
          </div>
        )}

        {/* Customers List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-semibold text-gray-800">Customers</h2>
              {customers.length > 0 && (
                <span className="text-xs text-gray-500">
                  {filteredCustomers.length} of {customers.length}
                </span>
              )}
            </div>
            {customers.length > 0 && (
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers by name or phone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="text-lg" />
                  </button>
                )}
              </div>
            )}
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No customers yet. Add your first customer above.
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No customers found matching "{searchQuery}"
            </div>
          ) : (
            <div className="divide-y">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer._id}
                  onClick={() => navigate(`/customer/${customer._id}`)}
                  className="px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 cursor-pointer transition active:bg-gray-100"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base truncate">{customer.name}</h3>
                      <p className="text-xs md:text-sm text-gray-500">{customer.mobile}</p>
                    </div>
                    <div className="text-indigo-600 flex-shrink-0 ml-2">
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
        )}

        {/* Payments Tab Content */}
        {activeTab === 'payments' && (
          <PaymentsTab user={user} />
        )}

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <SettingsTab 
            user={user} 
            customers={customers} 
            setCustomers={setCustomers}
            fetchCustomers={fetchCustomers}
            logout={logout}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab = ({ user, customers, setCustomers, fetchCustomers, logout, navigate }) => {
  const { t, language, changeLanguage } = useLanguage();
  const [settingsTab, setSettingsTab] = useState('payment');
  const [accountForm, setAccountForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    password: '',
    mpin: ''
  });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editCustomerForm, setEditCustomerForm] = useState({ name: '', mobile: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    type: 'upi',
    upiId: '',
    qrCode: '',
    label: '',
    isDefault: false
  });
  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [qrCodePreview, setQrCodePreview] = useState('');

  useEffect(() => {
    if (settingsTab === 'payment') {
      fetchPaymentMethods();
    }
  }, [settingsTab]);

  const fetchPaymentMethods = async () => {
    try {
      const res = await axios.get('/api/payment-methods');
      setPaymentMethods(res.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
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
        setPaymentMethodForm({ ...paymentMethodForm, qrCode: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    try {
      if (paymentMethodForm.type === 'upi' && !paymentMethodForm.upiId) {
        alert('Please enter UPI ID');
        return;
      }
      if (paymentMethodForm.type === 'qr' && !paymentMethodForm.qrCode) {
        alert('Please upload QR code');
        return;
      }
      await axios.post('/api/payment-methods', paymentMethodForm);
      await fetchPaymentMethods();
      setPaymentMethodForm({ type: 'upi', upiId: '', qrCode: '', label: '', isDefault: false });
      setQrCodeFile(null);
      setQrCodePreview('');
      setShowAddPaymentMethod(false);
      alert('Payment method added successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding payment method');
    }
  };

  const handleEditPaymentMethod = (method) => {
    setEditingPaymentMethod(method);
    setPaymentMethodForm({
      type: method.type,
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
      await axios.put(`/api/payment-methods/${editingPaymentMethod._id}`, paymentMethodForm);
      await fetchPaymentMethods();
      setEditingPaymentMethod(null);
      setPaymentMethodForm({ type: 'upi', upiId: '', qrCode: '', label: '', isDefault: false });
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
      await fetchPaymentMethods();
      alert('Payment method deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting payment method');
    }
  };

  useEffect(() => {
    if (user) {
      setAccountForm({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        password: '',
        mpin: ''
      });
    }
  }, [user]);

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: accountForm.name,
        phone: accountForm.phone,
        email: accountForm.email
      };
      if (accountForm.password) updateData.password = accountForm.password;
      if (accountForm.mpin) updateData.mpin = accountForm.mpin;

      const res = await axios.put('/api/auth/update', updateData);
      alert('Account updated successfully! Please login again.');
      logout();
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating account');
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setEditCustomerForm({ name: customer.name, mobile: customer.mobile });
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/customers/${editingCustomer._id}`, editCustomerForm);
      await fetchCustomers();
      setEditingCustomer(null);
      alert('Customer updated successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating customer');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer? All transactions will also be deleted.')) {
      return;
    }
    try {
      await axios.delete(`/api/customers/${customerId}`);
      await fetchCustomers();
      alert('Customer deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting customer');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      alert('Please enter your password to confirm');
      return;
    }
    try {
      // Verify password first
      const loginRes = await axios.post('/api/auth/login', {
        identifier: user.phone,
        password: deletePassword
      });
      
      if (loginRes.data.token) {
        await axios.delete('/api/auth/delete', {
          data: { reason: 'User requested account deletion' }
        });
        alert('Account deletion request submitted successfully. It will be reviewed by admin.');
        logout();
        navigate('/login');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid password. Account deletion failed.');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Settings Sub-tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex flex-wrap border-b">
          <button
            onClick={() => setSettingsTab('payment')}
            className={`flex-1 min-w-[120px] py-3 px-4 text-center font-medium transition text-xs md:text-sm ${
              settingsTab === 'payment'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FiCreditCard />
              <span>Payment</span>
            </div>
          </button>
          <button
            onClick={() => setSettingsTab('account')}
            className={`flex-1 min-w-[120px] py-3 px-4 text-center font-medium transition text-xs md:text-sm ${
              settingsTab === 'account'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FiUserIcon />
              <span>My Account</span>
            </div>
          </button>
          <button
            onClick={() => setSettingsTab('customers')}
            className={`flex-1 min-w-[120px] py-3 px-4 text-center font-medium transition text-xs md:text-sm ${
              settingsTab === 'customers'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FiUsers />
              <span>{t('manageMyCustomers')}</span>
            </div>
          </button>
          <button
            onClick={() => setSettingsTab('language')}
            className={`flex-1 min-w-[120px] py-3 px-4 text-center font-medium transition text-xs md:text-sm ${
              settingsTab === 'language'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FiGlobe />
              <span>{t('language')}</span>
            </div>
          </button>
          <button
            onClick={() => setSettingsTab('delete')}
            className={`flex-1 min-w-[120px] py-3 px-4 text-center font-medium transition text-xs md:text-sm ${
              settingsTab === 'delete'
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FiTrash2 />
              <span>{t('deleteMyAccount')}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Payment Settings */}
      {settingsTab === 'payment' && (
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800">Payment Methods</h3>
              <button
                onClick={() => {
                  setShowAddPaymentMethod(true);
                  setEditingPaymentMethod(null);
                  setPaymentMethodForm({ type: 'upi', upiId: '', qrCode: '', label: '', isDefault: false });
                  setQrCodeFile(null);
                  setQrCodePreview('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm md:text-base"
              >
                <FiPlus />
                <span>Add Payment Method</span>
              </button>
            </div>

            {/* Add/Edit Payment Method Form */}
            {(showAddPaymentMethod || editingPaymentMethod) && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-800">
                    {editingPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                  </h4>
                  <button
                    onClick={() => {
                      setShowAddPaymentMethod(false);
                      setEditingPaymentMethod(null);
                      setPaymentMethodForm({ type: 'upi', upiId: '', qrCode: '', label: '', isDefault: false });
                      setQrCodeFile(null);
                      setQrCodePreview('');
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition"
                  >
                    <FiX className="text-lg" />
                  </button>
                </div>
                <form onSubmit={editingPaymentMethod ? handleUpdatePaymentMethod : handleAddPaymentMethod} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                    <select
                      value={paymentMethodForm.type}
                      onChange={(e) => {
                        setPaymentMethodForm({ ...paymentMethodForm, type: e.target.value, upiId: '', qrCode: '' });
                        setQrCodeFile(null);
                        setQrCodePreview('');
                      }}
                      required
                      disabled={!!editingPaymentMethod}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                      <option value="upi">UPI ID</option>
                      <option value="qr">QR Code</option>
                    </select>
                  </div>

                  {paymentMethodForm.type === 'upi' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                      <input
                        type="text"
                        value={paymentMethodForm.upiId}
                        onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, upiId: e.target.value })}
                        required
                        placeholder="e.g., yourname@paytm"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">QR Code</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrCodeUpload}
                        required={!editingPaymentMethod || !paymentMethodForm.qrCode}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                      />
                      {qrCodePreview && (
                        <div className="mt-2">
                          <img src={qrCodePreview} alt="QR Code Preview" className="max-w-xs h-auto border border-gray-300 rounded-lg" />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Label (Optional)</label>
                    <input
                      type="text"
                      value={paymentMethodForm.label}
                      onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, label: e.target.value })}
                      placeholder="e.g., Personal UPI, Business QR"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={paymentMethodForm.isDefault}
                      onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, isDefault: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <label className="text-sm text-gray-700">Set as default payment method</label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
                    >
                      {editingPaymentMethod ? 'Update' : 'Add'} Payment Method
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPaymentMethod(false);
                        setEditingPaymentMethod(null);
                        setPaymentMethodForm({ type: 'upi', upiId: '', qrCode: '', label: '', isDefault: false });
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
            )}

            {/* Payment Methods List */}
            {paymentMethods.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FiImage className="mx-auto text-4xl text-gray-400 mb-2" />
                <p>No payment methods added yet</p>
                <p className="text-sm mt-1">Click "Add Payment Method" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            method.type === 'upi' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {method.type === 'upi' ? 'UPI' : 'QR Code'}
                          </span>
                          {method.isDefault && (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
                              Default
                            </span>
                          )}
                          {method.label && (
                            <span className="text-sm font-medium text-gray-700">{method.label}</span>
                          )}
                        </div>
                        {method.type === 'upi' ? (
                          <p className="text-base font-medium text-gray-800">{method.upiId}</p>
                        ) : (
                          <div className="mt-2">
                            {method.qrCode && (
                              <img 
                                src={method.qrCode} 
                                alt="QR Code" 
                                className="max-w-[150px] h-auto border border-gray-300 rounded-lg"
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">General Settings</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Default Currency</p>
                <p className="text-base font-medium text-gray-800">Indian Rupee (₹)</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Transaction Notifications</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded" />
                  <span className="text-sm text-gray-700">Enable transaction notifications</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage My Account */}
      {settingsTab === 'account' && (
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">Manage My Account</h3>
          <form onSubmit={handleUpdateAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={accountForm.name}
                onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={accountForm.phone}
                onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={accountForm.email}
                onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password (Leave blank to keep current)</label>
              <input
                type="password"
                value={accountForm.password}
                onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New MPIN (Leave blank to keep current)</label>
              <input
                type="password"
                value={accountForm.mpin}
                onChange={(e) => setAccountForm({ ...accountForm, mpin: e.target.value })}
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Enter new MPIN (4-6 digits)"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Update Account
            </button>
          </form>
        </div>
      )}

      {/* Manage My Customers */}
      {settingsTab === 'customers' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800">Manage My Customers</h3>
          </div>
          {customers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No customers found</div>
          ) : (
            <div className="divide-y">
              {customers.map((customer) => (
                <div key={customer._id} className="px-4 md:px-6 py-4">
                  {editingCustomer?._id === customer._id ? (
                    <form onSubmit={handleUpdateCustomer} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={editCustomerForm.name}
                          onChange={(e) => setEditCustomerForm({ ...editCustomerForm, name: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          value={editCustomerForm.mobile}
                          onChange={(e) => setEditCustomerForm({ ...editCustomerForm, mobile: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCustomer(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-sm md:text-base">{customer.name}</h4>
                        <p className="text-xs md:text-sm text-gray-500">{customer.mobile}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-xs md:text-sm hover:bg-indigo-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs md:text-sm hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Account */}
      {settingsTab === 'language' && (
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">{t('selectLanguage')}</h3>
            <div className="space-y-3">
              <button
                onClick={() => changeLanguage('en')}
                className={`w-full p-4 rounded-lg border-2 transition ${
                  language === 'en'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('english')}</span>
                  {language === 'en' && (
                    <span className="text-indigo-600">✓</span>
                  )}
                </div>
              </button>
              <button
                onClick={() => changeLanguage('hi')}
                className={`w-full p-4 rounded-lg border-2 transition ${
                  language === 'hi'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('hinglish')}</span>
                  {language === 'hi' && (
                    <span className="text-indigo-600">✓</span>
                  )}
                </div>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {language === 'en' 
                ? 'Select your preferred language. Changes will be applied immediately.'
                : 'अपनी पसंदीदा भाषा चुनें। बदलाव तुरंत लागू होंगे।'}
            </p>
          </div>
        </div>
      )}

      {settingsTab === 'delete' && (
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Delete My Account</h3>
            <p className="text-sm text-red-700">
              Warning: This action cannot be undone. All your data including customers and transactions will be permanently deleted.
            </p>
          </div>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition"
            >
              Delete My Account
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">
                  Enter your password to confirm deletion
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="Enter password"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

// Payments Tab Component
const PaymentsTab = ({ user }) => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalPayments: 0,
    totalAmount: 0,
    completed: 0,
    pending: 0,
    failed: 0
  });
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);

  useEffect(() => {
    fetchPayments();
    fetchSummary();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/payments');
      setPayments(res.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get('/api/payments/summary');
      setSummary(res.data);
    } catch (error) {
      console.error('Error fetching payment summary:', error);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      await axios.post(`/api/payments/${paymentId}/approve`);
      await fetchPayments();
      await fetchSummary();
      alert('Payment approved successfully and transaction has been updated');
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
      await fetchPayments();
      await fetchSummary();
      alert('Payment rejected');
    } catch (error) {
      alert(error.response?.data?.message || 'Error rejecting payment');
    }
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
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-indigo-500">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Total Payments</p>
          <p className="text-xl md:text-2xl font-bold text-indigo-600">{summary.totalPayments}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-green-500">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Total Amount</p>
          <p className="text-xl md:text-2xl font-bold text-green-600">{formatCurrency(summary.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-blue-500">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Completed</p>
          <p className="text-xl md:text-2xl font-bold text-blue-600">{summary.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-yellow-500">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-xl md:text-2xl font-bold text-yellow-600">{summary.pending}</p>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b">
          <h2 className="text-base md:text-lg font-semibold text-gray-800">Payment History</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiDollarSign className="mx-auto text-4xl text-gray-400 mb-2" />
            <p>No payments received yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
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
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.payerDetails ? (
                        <>
                          <div className="font-medium text-gray-900">{payment.payerDetails.name}</div>
                          <div className="text-xs text-gray-500">{payment.payerPhoneNumber}</div>
                        </>
                      ) : (
                        <div className="text-gray-900">{payment.payerPhoneNumber}</div>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        payment.paymentMethodType === 'upi' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {payment.paymentMethodType === 'upi' ? 'UPI' : 'QR'}
                      </span>
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
                            <span>View</span>
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

export default Dashboard;

