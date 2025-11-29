import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiShare2, FiCreditCard } from 'react-icons/fi';

const SharedTransactions = () => {
  const { token: rawToken } = useParams();
  // Decode the token to handle URL encoding (e.g., %20 for spaces)
  const token = decodeURIComponent(rawToken || '');
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchSharedLinkData();
  }, [token]);

  const fetchSharedLinkData = async () => {
    try {
      const res = await axios.get(`/api/transactions/shared/${token}`);
      setUser(res.data.user);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid or expired link');
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError('Please enter phone number');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await axios.post(`/api/transactions/shared/${token}/verify`, {
        phoneNumber
      });
      setTransactions(res.data.transactions);
      setUser(res.data.user);
      setVerified(true);
      // Store phone number for payment page
      setPhoneNumber(phoneNumber);
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid phone number');
    } finally {
      setVerifying(false);
    }
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

  const calculateSummary = () => {
    // Reverse perspective: From the recipient's point of view
    // If owner received, recipient gave (shows in "You Gave")
    // If owner gave, recipient received (shows in "You Took")
    let totalReceived = 0; // What recipient received (owner gave)
    let totalGiven = 0; // What recipient gave (owner received)
    let currentBalance = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'given') {
        // Owner gave = Recipient received
        totalReceived += transaction.amount;
      } else if (transaction.type === 'received') {
        // Owner received = Recipient gave
        totalGiven += transaction.amount;
      }
    });

    if (transactions.length > 0) {
      // Reverse the balance: if owner balance is -300, recipient balance is +300
      currentBalance = -transactions[0].balance;
    }

    return { totalReceived, totalGiven, currentBalance };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error && !verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-red-600 text-2xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Link Invalid or Expired</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiArrowLeft className="text-xl text-gray-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Shared Transaction History</h1>
                {user && (
                  <p className="text-sm text-gray-500">{user.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow p-6 md:p-8">
            <div className="text-center mb-6">
              <FiShare2 className="mx-auto text-4xl text-indigo-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Enter Phone Number</h2>
              <p className="text-gray-600">
                Enter the phone number to view transaction history
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base"
                  placeholder="Enter phone number"
                />
              </div>
              <button
                type="submit"
                disabled={verifying}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? 'Verifying...' : 'View Transactions'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const summary = calculateSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FiArrowLeft className="text-xl text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {user ? user.name : 'Transaction History'}
              </h1>
              {user && (
                <p className="text-sm text-gray-500">{user.phone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Pay Now Button - Show if balance is not zero */}
        {summary.currentBalance !== 0 && (
          <div className="mb-6">
            <button
              onClick={() => navigate(`/shared/${token}/payment`, {
                state: {
                  balance: summary.currentBalance,
                  user: user,
                  phoneNumber: phoneNumber
                }
              })}
              className={`w-full py-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 shadow-lg text-base ${
                summary.currentBalance > 0
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <FiCreditCard className="text-xl" />
              <span>
                {summary.currentBalance > 0 
                  ? `Pay Now - ${formatCurrency(summary.currentBalance)}` 
                  : `Pay Now - ${formatCurrency(Math.abs(summary.currentBalance))}`
                }
              </span>
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow">
          {/* Table Header */}
          <div className="px-4 py-3 bg-gray-100 border-b grid grid-cols-3 gap-4 text-sm font-semibold text-gray-700">
            <div>ENTRIES</div>
            <div className="text-red-600">You Gave</div>
            <div className="text-green-600">You Took</div>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transactions found.
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
                      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-b">
                        {formatDate(transaction.createdAt).split(' • ')[0]} • {getRelativeTime(transaction.createdAt)}
                      </div>
                    )}
                    <div className="px-4 py-4 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</p>
                        {/* Reverse balance for recipient's perspective */}
                        <p className="text-xs text-gray-500 mt-1">Bal. {formatCurrency(-transaction.balance)}</p>
                        {transaction.customerId && (
                          <p className="text-xs text-gray-600 mt-1">
                            Customer: {transaction.customerId.name}
                          </p>
                        )}
                        {transaction.description && (
                          <p className="text-xs text-gray-600 mt-1">{transaction.description}</p>
                        )}
                      </div>
                      {/* Reverse perspective: If owner gave, recipient received (shows in green "You Took") */}
                      {/* If owner received, recipient gave (shows in red "You Gave") */}
                      <div className="text-red-600 font-medium">
                        {transaction.type === 'received' ? formatCurrency(transaction.amount) : ''}
                      </div>
                      <div className="text-green-600 font-medium">
                        {transaction.type === 'given' ? formatCurrency(transaction.amount) : ''}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedTransactions;

