const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, mpin, email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this phone number' });
    }

    // Create new user
    const user = new User({
      name,
      phone,
      password,
      mpin,
      email: email || ''
      // role defaults to 'user' as defined in the User model
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, mpin } = req.body;

    if (!identifier || (!password && !mpin)) {
      return res.status(400).json({ message: 'Please provide identifier and password or MPIN' });
    }

    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Account not found', accountNotFound: true });
    }

    // Verify password or MPIN
    let isValid = false;
    if (password) {
      isValid = await user.comparePassword(password);
    } else if (mpin) {
      isValid = await user.compareMPIN(mpin);
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Get all users (Admin only)
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const users = await User.find().select('-password -mpin').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all account deletion requests (Admin only)
router.get('/deletion-requests', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const AccountDeletionRequest = require('../models/AccountDeletionRequest');
    const requests = await AccountDeletionRequest.find()
      .populate('userId', 'name phone email')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve account deletion request (Admin only)
router.post('/deletion-requests/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const AccountDeletionRequest = require('../models/AccountDeletionRequest');
    const request = await AccountDeletionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Deletion request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Delete all user's data
    const Customer = require('../models/Customer');
    const Transaction = require('../models/Transaction');
    const Payment = require('../models/Payment');
    const PaymentMethod = require('../models/PaymentMethod');
    const SharedLink = require('../models/SharedLink');
    
    await Customer.deleteMany({ userId: request.userId });
    await Transaction.deleteMany({ userId: request.userId });
    await Payment.deleteMany({ userId: request.userId });
    await PaymentMethod.deleteMany({ userId: request.userId });
    await SharedLink.deleteMany({ userId: request.userId });
    await User.findByIdAndDelete(request.userId);

    // Update request status
    request.status = 'approved';
    request.processedAt = new Date();
    request.processedBy = req.user._id;
    await request.save();

    res.json({ message: 'Account deletion approved and account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject account deletion request (Admin only)
router.post('/deletion-requests/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const AccountDeletionRequest = require('../models/AccountDeletionRequest');
    const request = await AccountDeletionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Deletion request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    request.status = 'rejected';
    request.processedAt = new Date();
    request.processedBy = req.user._id;
    await request.save();

    res.json({ message: 'Account deletion request rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user account
router.put('/update', auth, async (req, res) => {
  try {
    const { name, phone, email, password, mpin } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) {
      // Check if phone is already taken by another user
      const existingUser = await User.findOne({ phone, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
      user.phone = phone;
    }
    if (email) user.email = email;
    if (password) user.password = password; // Will be hashed by pre-save hook
    if (mpin) user.mpin = mpin; // Will be hashed by pre-save hook

    await user.save();

    res.json({
      message: 'Account updated successfully',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot password - verify account
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }

    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    }).select('name email phone');

    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({
      name: user.name,
      email: user.email,
      phone: user.phone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot password - reset password or MPIN
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { identifier, password, mpin } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }

    if (!password && !mpin) {
      return res.status(400).json({ message: 'Please provide new password or MPIN' });
    }

    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Update password or MPIN
    if (password) {
      user.password = password; // Will be hashed by pre-save hook
    }

    if (mpin) {
      if (mpin.length !== 4) {
        return res.status(400).json({ message: 'MPIN must be exactly 4 digits' });
      }
      user.mpin = mpin; // Will be hashed by pre-save hook
    }

    await user.save();

    res.json({
      message: `${password ? 'Password' : 'MPIN'} reset successfully`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user account (creates deletion request)
router.delete('/delete', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's already a pending request
    const AccountDeletionRequest = require('../models/AccountDeletionRequest');
    const existingRequest = await AccountDeletionRequest.findOne({
      userId: req.user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Account deletion request already pending' });
    }

    // Create deletion request instead of immediate deletion
    const deletionRequest = new AccountDeletionRequest({
      userId: req.user._id,
      status: 'pending',
      reason: req.body.reason || ''
    });

    await deletionRequest.save();

    res.json({ 
      message: 'Account deletion request submitted successfully. It will be reviewed by admin.',
      requestId: deletionRequest._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

