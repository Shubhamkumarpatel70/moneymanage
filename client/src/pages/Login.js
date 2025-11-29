import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mpin, setMpin] = useState('');
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'mpin'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!identifier) {
      setError('Please enter email or phone number');
      setLoading(false);
      return;
    }

    if (loginMethod === 'password' && !password) {
      setError('Please enter password');
      setLoading(false);
      return;
    }

    if (loginMethod === 'mpin' && !mpin) {
      setError('Please enter MPIN');
      setLoading(false);
      return;
    }

    try {
      const result = await login(
        identifier,
        loginMethod === 'password' ? password : undefined,
        loginMethod === 'mpin' ? mpin : undefined
      );
      setLoading(false);

      if (result.success) {
        navigate('/dashboard');
      } else {
        // Check if account not found, redirect to register
        if (result.accountNotFound) {
          navigate('/register', { state: { message: 'Account not found. Please register first.', identifier } });
        } else {
          setError(result.message);
        }
      }
    } catch (error) {
      setLoading(false);
      if (error.response?.status === 404 && error.response?.data?.accountNotFound) {
        navigate('/register', { state: { message: 'Account not found. Please register first.', identifier } });
      } else {
        setError(error.response?.data?.message || 'Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Login
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('password');
                setMpin('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                loginMethod === 'password'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('mpin');
                setPassword('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                loginMethod === 'mpin'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              MPIN
            </button>
          </div>

          {loginMethod === 'password' ? (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Enter password"
              />
            </div>
          ) : (
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                MPIN (4 digits)
              </label>
              <div className="flex gap-2 justify-center">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    type="password"
                    value={mpin[index] || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 1);
                      if (value) {
                        const newMpin = mpin.split('');
                        newMpin[index] = value;
                        setMpin(newMpin.join('').slice(0, 4));
                        // Auto-focus next box
                        if (index < 3 && value) {
                          const nextInput = document.getElementById(`mpin-${index + 1}`);
                          if (nextInput) nextInput.focus();
                        }
                      } else {
                        const newMpin = mpin.split('');
                        newMpin[index] = '';
                        setMpin(newMpin.join(''));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !mpin[index] && index > 0) {
                        const prevInput = document.getElementById(`mpin-${index - 1}`);
                        if (prevInput) prevInput.focus();
                      }
                    }}
                    id={`mpin-${index}`}
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 space-y-2">
          <p className="text-center">
            <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
              Forgot Password or MPIN?
            </Link>
          </p>
          <p className="text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

