import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiCreditCard, FiImage, FiCheck } from 'react-icons/fi';

const PaymentDetails = () => {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState('');
  const { balance, user, phoneNumber } = location.state || {};

  useEffect(() => {
    if (!balance || !user) {
      navigate(`/shared/${token}`);
      return;
    }
    fetchPaymentMethods();
  }, [token, balance, user, navigate]);

  const fetchPaymentMethods = async () => {
    try {
      const res = await axios.get(`/api/transactions/shared/${token}/payment-methods`);
      setPaymentMethods(res.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setPaymentProofPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }
    if (!paymentProof) {
      alert('Payment proof (screenshot/receipt) is required. Please upload an image.');
      return;
    }
    setProcessing(true);
    try {
      let paymentProofBase64 = '';
      if (paymentProof) {
        const reader = new FileReader();
        paymentProofBase64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(paymentProof);
        });
      }
      
      // Process payment
      await axios.post(`/api/transactions/shared/${token}/payment`, {
        paymentMethodId: selectedMethod._id,
        phoneNumber: phoneNumber,
        amount: Math.abs(balance),
        paymentProof: paymentProofBase64
      });
      setPaymentSuccess(true);
      setTimeout(() => {
        navigate(`/shared/${token}`);
      }, 3000);
    } catch (error) {
      alert(error.response?.data?.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="text-3xl text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Your payment has been processed successfully.</p>
          <p className="text-sm text-gray-500">Redirecting to transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/shared/${token}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FiArrowLeft className="text-xl text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Payment Details</h1>
              {user && (
                <p className="text-sm text-gray-500">{user.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Payment Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Payable Amount</span>
              <span className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(balance))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pay To</span>
              <span className="font-medium text-gray-800">{user?.name || 'N/A'}</span>
            </div>
            {balance < 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  You owe {formatCurrency(Math.abs(balance))} to {user?.name}
                </p>
              </div>
            )}
            {balance > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  {user?.name} owes you {formatCurrency(balance)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Payment Method</h2>
          
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <FiCreditCard className="mx-auto text-4xl text-gray-400 mb-2" />
              <p className="text-gray-500 mb-2">No payment methods available</p>
              <p className="text-sm text-gray-400">Please contact {user?.name} for payment details</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => (
                <div
                  key={method._id}
                  onClick={() => setSelectedMethod(method)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedMethod?._id === method._id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedMethod?._id === method._id
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedMethod?._id === method._id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
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
                              className="max-w-[120px] h-auto border border-gray-300 rounded-lg"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payment Instructions */}
          {selectedMethod && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Payment Instructions</h3>
              {selectedMethod.type === 'upi' ? (
                <div className="space-y-2 text-sm text-blue-700">
                  <p>1. Open your UPI app (Google Pay, PhonePe, Paytm, etc.)</p>
                  <p>2. Enter the UPI ID: <strong>{selectedMethod.upiId}</strong></p>
                  <p>3. Enter amount: <strong>{formatCurrency(Math.abs(balance))}</strong></p>
                  <p>4. Complete the payment</p>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-blue-700">
                  <p>1. Open your UPI app</p>
                  <p>2. Scan the QR code below</p>
                  <p>3. Enter amount: <strong>{formatCurrency(Math.abs(balance))}</strong></p>
                  <p>4. Complete the payment</p>
                  {selectedMethod.qrCode && (
                    <div className="mt-3 flex justify-center">
                      <img 
                        src={selectedMethod.qrCode} 
                        alt="Payment QR Code" 
                        className="max-w-[200px] h-auto border-2 border-blue-300 rounded-lg p-2 bg-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment Proof Upload */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiImage className="inline mr-2" />
              Payment Proof (Screenshot/Receipt) <span className="text-red-600">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePaymentProofUpload}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm bg-white"
            />
            {paymentProofPreview && (
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">Preview:</p>
                <img 
                  src={paymentProofPreview} 
                  alt="Payment Proof Preview" 
                  className="max-w-full h-auto max-h-64 border border-gray-300 rounded-lg shadow-sm object-contain bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPaymentProof(null);
                    setPaymentProofPreview('');
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove Image
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              <span className="text-red-600 font-semibold">Required:</span> Upload a screenshot or receipt of your payment for verification
            </p>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={!selectedMethod || !paymentProof || processing}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FiCreditCard />
                <span>Confirm Payment</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            By confirming, you acknowledge that you have completed the payment through the selected method.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;

