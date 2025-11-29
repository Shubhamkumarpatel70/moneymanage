import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    phone: location.state?.identifier || '',
    email: '',
    password: '',
    mpin: ''
  });
  const [error, setError] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mpin') {
      // Only allow digits and limit to 4
      const numericValue = value.replace(/\D/g, '').slice(0, 4);
      setFormData({
        ...formData,
        [name]: numericValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.mpin.length !== 4) {
      setError('MPIN must be exactly 4 digits');
      setLoading(false);
      return;
    }

    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      navigate('/login');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Create Account
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Enter email (optional)"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Enter password"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              MPIN (4 digits)
            </label>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  type="password"
                  name={`mpin-${index}`}
                  value={formData.mpin[index] || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 1);
                    if (value) {
                      const newMpin = formData.mpin.split('');
                      newMpin[index] = value;
                      const updatedMpin = newMpin.join('').slice(0, 4);
                      setFormData({ ...formData, mpin: updatedMpin });
                      // Auto-focus next box
                      if (index < 3 && value) {
                        const nextInput = document.getElementById(`register-mpin-${index + 1}`);
                        if (nextInput) nextInput.focus();
                      }
                    } else {
                      const newMpin = formData.mpin.split('');
                      newMpin[index] = '';
                      setFormData({ ...formData, mpin: newMpin.join('') });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !formData.mpin[index] && index > 0) {
                      const prevInput = document.getElementById(`register-mpin-${index - 1}`);
                      if (prevInput) prevInput.focus();
                    }
                  }}
                  id={`register-mpin-${index}`}
                  required
                  maxLength={1}
                  className="w-16 h-16 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="•"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

