import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import PrivateRoute from './components/PrivateRoute';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CustomerTransactions from './pages/CustomerTransactions';
import SharedTransactions from './pages/SharedTransactions';
import PaymentDetails from './pages/PaymentDetails';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/shared/:token" element={<SharedTransactions />} />
          <Route path="/shared/:token/payment" element={<PaymentDetails />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/customer/:customerId"
            element={
              <PrivateRoute>
                <CustomerTransactions />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

