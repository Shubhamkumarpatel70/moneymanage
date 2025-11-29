import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiDollarSign, FiUsers, FiTrendingUp, FiShield, FiSmartphone } from 'react-icons/fi';

const Home = () => {
  const navigate = useNavigate();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show install prompt after a delay
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDeclineInstall = () => {
    setShowInstallPrompt(false);
    // Store in localStorage to not show again for this session
    localStorage.setItem('pwa-install-declined', 'true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Install PWA Modal */}
      {showInstallPrompt && !localStorage.getItem('pwa-install-declined') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <FiSmartphone className="text-3xl text-indigo-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
              Install Money Management App
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Install our app to access your money management tools offline and get a better experience on your device.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeclineInstall}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Decline
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                <FiSmartphone />
                Install Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Manage Your Money
            <span className="text-indigo-600"> Smartly</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track your expenses, manage customers, and handle transactions all in one place. 
            Simple, secure, and efficient money management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Get Started
              <FiArrowRight />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition"
            >
              Login
            </button>
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <FiSmartphone />
                Download App
              </button>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <FiDollarSign className="text-2xl text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Track Transactions</h3>
            <p className="text-gray-600">
              Easily record and monitor all your money transactions. Keep track of what you've given and received.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <FiUsers className="text-2xl text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Customers</h3>
            <p className="text-gray-600">
              Organize your customer database and track individual transaction history with detailed records.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <FiTrendingUp className="text-2xl text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Financial Insights</h3>
            <p className="text-gray-600">
              Get a clear overview of your financial status with comprehensive summaries and analytics.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <FiShield className="text-2xl text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Secure & Private</h3>
            <p className="text-gray-600">
              Your financial data is protected with advanced security measures and encryption.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <FiSmartphone className="text-2xl text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Mobile Friendly</h3>
            <p className="text-gray-600">
              Access your money management tools from any device. Works seamlessly on mobile and desktop.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <FiDollarSign className="text-2xl text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Payment Tracking</h3>
            <p className="text-gray-600">
              Monitor all payments received through shared links with detailed payment history and proof.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">100%</div>
              <div className="text-gray-600">Secure</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">24/7</div>
              <div className="text-gray-600">Access</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">Free</div>
              <div className="text-gray-600">Forever</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

