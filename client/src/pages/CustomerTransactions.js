import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiPlus, FiShare2, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

const CustomerTransactions = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [shareMobile, setShareMobile] = useState('');
  const [transactionForm, setTransactionForm] = useState({
    type: 'received',
    amount: '',
    description: ''
  });
  const [editForm, setEditForm] = useState({
    amount: '',
    description: '',
    date: '',
    time: ''
  });
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
    fetchTransactions();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const res = await axios.get(`/api/customers/${customerId}`);
      setCustomer(res.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`/api/transactions/customer/${customerId}`);
      setTransactions(res.data);
      // Calculate current balance from the most recent transaction
      // The balance field in the last transaction (first in array) is the current balance for this customer
      if (res.data.length > 0) {
        // Get the most recent transaction's balance (first item in sorted array)
        setBalance(res.data[0].balance);
      } else {
        // If no transactions, balance is 0
        setBalance(0);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/transactions', {
        customerId,
        type: transactionForm.type,
        amount: parseFloat(transactionForm.amount),
        description: transactionForm.description
      });
      setTransactions([res.data, ...transactions]);
      setBalance(res.data.balance);
      setTransactionForm({ type: 'received', amount: '', description: '' });
      setShowAddTransaction(false);
      await fetchTransactions(); // Refresh to recalculate balances
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding transaction');
    }
  };

  const handleEditTransaction = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/transactions/${selectedTransaction._id}`, {
        amount: parseFloat(editForm.amount),
        description: editForm.description,
        date: editForm.date,
        time: editForm.time
      });
      await fetchTransactions();
      setShowEntryModal(false);
      setSelectedTransaction(null);
      alert('Transaction updated successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating transaction');
    }
  };

  const handleDeleteTransaction = async () => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    try {
      await axios.delete(`/api/transactions/${selectedTransaction._id}`);
      await fetchTransactions();
      setShowEntryModal(false);
      setSelectedTransaction(null);
      alert('Transaction deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting transaction');
    }
  };

  const handleShareHistory = async (e) => {
    e.preventDefault();
    if (!shareMobile) {
      alert('Please enter mobile number');
      return;
    }
    try {
      const res = await axios.post('/api/transactions/share/history', {
        mobileNumber: shareMobile,
        customerId: customerId // Share only this customer's transactions
      });
      
      const shareUrl = res.data.shareUrl;
      
      // Prepare share text with customer details
      const customerInfo = customer ? `Customer: ${customer.name}\nPhone: ${customer.mobile}\n\n` : '';
      const shareText = `${customerInfo}Transaction History Link:\n${shareUrl}\n\nPlease enter your phone number: ${shareMobile} to view the transactions.`;
      
      // Copy to clipboard with customer details
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        alert(`Shareable link with customer details copied to clipboard!\n\n${shareText}`);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`Shareable link with customer details copied!\n\n${shareText}`);
      }
      
      // Try native share if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: customer ? `Transaction History - ${customer.name}` : 'Transaction History',
            text: shareText,
            url: shareUrl
          });
        } catch (shareError) {
          // User cancelled or error occurred, but link is already copied
        }
      }
      
      setShowShareModal(false);
      setShareMobile('');
    } catch (error) {
      alert(error.response?.data?.message || 'Error sharing transaction history');
    }
  };

  const handleShareEntry = async (e) => {
    e.preventDefault();
    if (!shareMobile) {
      alert('Please enter mobile number');
      return;
    }
    if (!selectedTransaction) {
      alert('No transaction selected');
      return;
    }
    try {
      const res = await axios.post(`/api/transactions/share/entry/${selectedTransaction._id}`, {
        mobileNumber: shareMobile
      });
      
      const shareText = `Transaction Details from ${res.data.user.name}\n\n` +
        `Date: ${formatDate(selectedTransaction.createdAt)}\n` +
        `Type: ${selectedTransaction.type === 'given' ? 'Given' : 'Received'}\n` +
        `Amount: ₹${selectedTransaction.amount}\n` +
        `Balance: ₹${selectedTransaction.balance}\n` +
        (selectedTransaction.description ? `Description: ${selectedTransaction.description}` : '');
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Transaction Entry',
            text: shareText
          });
        } catch (shareError) {
          // User cancelled or error occurred
        }
      }
      
      alert(`Transaction entry shared with ${shareMobile} successfully!`);
      setShowShareModal(false);
      setShareMobile('');
      setSelectedTransaction(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Error sharing transaction entry');
    }
  };

  const openEntryModal = (transaction) => {
    setSelectedTransaction(transaction);
    const transactionDate = new Date(transaction.createdAt);
    const dateStr = transactionDate.toISOString().split('T')[0];
    const timeStr = transactionDate.toTimeString().split(' ')[0].substring(0, 5);
    setEditForm({
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      date: dateStr,
      time: timeStr
    });
    setShowEntryModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${day} ${month} ${year} • ${time}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return formatDate(dateString);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
              >
                <FiArrowLeft className="text-lg md:text-xl text-gray-700" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base md:text-xl font-bold text-gray-800 truncate">
                  {customer ? customer.name : 'Loading...'}
                </h1>
                {customer && (
                  <p className="text-xs md:text-sm text-gray-500 truncate">{customer.mobile}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setShareMobile('');
                setShowShareModal(true);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
              title="Share Transaction History"
            >
              <FiShare2 className="text-lg md:text-xl text-indigo-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {/* Balance Card */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Current Balance</p>
          <p className={`text-2xl md:text-3xl font-bold ${balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
            {formatCurrency(balance)}
          </p>
        </div>

        {/* Add Transaction Buttons */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          <button
            onClick={() => {
              setTransactionForm({ type: 'given', amount: '', description: '' });
              setShowAddTransaction(true);
            }}
            className="bg-red-600 text-white py-3 md:py-4 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg text-sm md:text-base"
          >
            <FiPlus className="text-base md:text-lg" />
            <span className="truncate">You Gave</span>
          </button>
          <button
            onClick={() => {
              setTransactionForm({ type: 'received', amount: '', description: '' });
              setShowAddTransaction(true);
            }}
            className="bg-green-600 text-white py-3 md:py-4 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg text-sm md:text-base"
          >
            <FiPlus className="text-base md:text-lg" />
            <span className="truncate">You Took</span>
          </button>
        </div>

        {/* Add Transaction Form */}
        {showAddTransaction && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-800">
              Add Transaction ({transactionForm.type === 'given' ? 'You Gave' : 'You Received'})
            </h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base"
                  placeholder="Enter description"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className={`flex-1 py-2 rounded-lg font-medium transition text-base ${
                    transactionForm.type === 'given'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  Add Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTransaction(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow">
          {/* Table Header */}
          <div className="px-3 md:px-4 py-2 md:py-3 bg-gray-100 border-b grid grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm font-semibold text-gray-700">
            <div>ENTRIES</div>
            <div className="text-red-600">You Gave</div>
            <div className="text-green-600">You Took</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transactions yet. Add your first transaction above.
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((transaction, index) => {
                const isFirstInGroup = index === 0 || 
                  new Date(transaction.createdAt).toDateString() !== 
                  new Date(transactions[index - 1].createdAt).toDateString();
                
                return (
                  <React.Fragment key={transaction._id}>
                    {isFirstInGroup && (
                      <div className="px-3 md:px-4 py-2 bg-gray-50 text-xs text-gray-500 border-b">
                        {formatDate(transaction.createdAt).split(' • ')[0]} • {getRelativeTime(transaction.createdAt)}
                      </div>
                    )}
                    <div 
                      onClick={() => openEntryModal(transaction)}
                      className="px-3 md:px-4 py-3 md:py-4 grid grid-cols-3 gap-2 md:gap-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition"
                    >
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-gray-600 truncate">{formatDate(transaction.createdAt)}</p>
                        <p className="text-xs text-gray-500 mt-1">Bal. {formatCurrency(transaction.balance)}</p>
                        {transaction.description && (
                          <p className="text-xs text-gray-600 mt-1 truncate">{transaction.description}</p>
                        )}
                      </div>
                      <div className="text-red-600 font-medium text-sm md:text-base">
                        {transaction.type === 'given' ? formatCurrency(transaction.amount) : ''}
                      </div>
                      <div className="text-green-600 font-medium text-sm md:text-base">
                        {transaction.type === 'received' ? formatCurrency(transaction.amount) : ''}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800">
                Share {selectedTransaction ? 'Transaction Entry' : 'Transaction History'}
              </h3>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareMobile('');
                  if (!showEntryModal) {
                    setSelectedTransaction(null);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            {!selectedTransaction ? (
              <form onSubmit={handleShareHistory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={shareMobile}
                    onChange={(e) => setShareMobile(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base"
                    placeholder="Enter mobile number"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the phone number that should have access to view your transaction history. A shareable link will be generated.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
                  >
                    Generate Share Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareModal(false);
                      setShareMobile('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleShareEntry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={shareMobile}
                    onChange={(e) => setShareMobile(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base"
                    placeholder="Enter mobile number"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter mobile number to share this transaction entry
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareModal(false);
                      setShareMobile('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Entry Modal */}
      {showEntryModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800">Transaction Details</h3>
              <button
                onClick={() => {
                  setShowEntryModal(false);
                  setSelectedTransaction(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Date & Time</p>
                <p className="text-base font-medium text-gray-800">{formatDate(selectedTransaction.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <p className={`text-base font-medium ${selectedTransaction.type === 'received' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedTransaction.type === 'received' ? 'Received' : 'Given'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Balance</p>
                <p className={`text-base font-medium ${selectedTransaction.balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                  {formatCurrency(selectedTransaction.balance)}
                </p>
              </div>
            </div>

            <form onSubmit={handleEditTransaction} className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={editForm.time}
                  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base"
                  placeholder="Enter description"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  <FiEdit2 />
                  <span>Update</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTransaction}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  <FiTrash2 />
                  <span className="hidden sm:inline">Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEntryModal(false);
                    setShareMobile('');
                    // Keep selectedTransaction for sharing
                    setTimeout(() => setShowShareModal(true), 100);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <FiShare2 />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerTransactions;
