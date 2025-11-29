import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiUser, FiLock } from 'react-icons/fi';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: verify, 2: reset
  const [identifier, setIdentifier] = useState('');
  const [userName, setUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [resetType, setResetType] = useState('password'); // 'password' or 'mpin'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!identifier) {
      setError('Please enter email or phone number');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('/api/auth/forgot-password/verify', { identifier });
      setUserName(res.data.name);
      setStep(2);
      setSuccess(`Account found: ${res.data.name}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Account not found');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (resetType === 'password' && !newPassword) {
      setError('Please enter new password');
      setLoading(false);
      return;
    }

    if (resetType === 'mpin' && !newMpin) {
      setError('Please enter new MPIN');
      setLoading(false);
      return;
    }

    if (resetType === 'mpin' && newMpin.length !== 4) {
      setError('MPIN must be exactly 4 digits');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/auth/forgot-password/reset', {
        identifier,
        password: resetType === 'password' ? newPassword : undefined,
        mpin: resetType === 'mpin' ? newMpin : undefined
      });
      setSuccess(`${resetType === 'password' ? 'Password' : 'MPIN'} reset successfully! Redirecting to login...`);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => step === 1 ? navigate('/login') : setStep(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiArrowLeft className="text-xl text-gray-600" />
          </button>
          <h2 className="text-3xl font-bold text-gray-800">
            {step === 1 ? 'Forgot Password' : 'Reset Password/MPIN'}
          </h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email or Phone Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Enter email or phone"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-indigo-800">
                <FiUser className="text-xl" />
                <span className="font-semibold">Account Found</span>
              </div>
              <p className="text-indigo-700 mt-1">{userName}</p>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setResetType('password');
                  setNewMpin('');
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  resetType === 'password'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Reset Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetType('mpin');
                  setNewPassword('');
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  resetType === 'mpin'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Reset MPIN
              </button>
            </div>

            {resetType === 'password' ? (
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter new password"
                />
              </div>
            ) : (
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  New MPIN (4 digits)
                </label>
                <div className="flex gap-2 justify-center">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type="password"
                      value={newMpin[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 1);
                        if (value) {
                          const newMpinArray = newMpin.split('');
                          newMpinArray[index] = value;
                          const updatedMpin = newMpinArray.join('').slice(0, 4);
                          setNewMpin(updatedMpin);
                          // Auto-focus next box
                          if (index < 3 && value) {
                            const nextInput = document.getElementById(`forgot-mpin-${index + 1}`);
                            if (nextInput) nextInput.focus();
                          }
                        } else {
                          const newMpinArray = newMpin.split('');
                          newMpinArray[index] = '';
                          setNewMpin(newMpinArray.join(''));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !newMpin[index] && index > 0) {
                          const prevInput = document.getElementById(`forgot-mpin-${index - 1}`);
                          if (prevInput) prevInput.focus();
                        }
                      }}
                      id={`forgot-mpin-${index}`}
                      required
                      maxLength={1}
                      className="w-16 h-16 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="•"
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : `Reset ${resetType === 'password' ? 'Password' : 'MPIN'}`}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-600">
          Remember your credentials?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

