const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

// Get all transactions for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate('customerId', 'name mobile')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transactions for a specific customer
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user._id,
      customerId: req.params.customerId
    })
      .populate('customerId', 'name mobile')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new transaction
router.post('/', auth, async (req, res) => {
  try {
    const { customerId, type, amount, description } = req.body;

    if (!customerId || !type || !amount) {
      return res.status(400).json({ message: 'Customer, type, and amount are required' });
    }

    // Verify customer belongs to user
    const customer = await Customer.findOne({ _id: customerId, userId: req.user._id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get last transaction for THIS CUSTOMER to calculate balance per customer
    const lastTransaction = await Transaction.findOne({ 
      userId: req.user._id,
      customerId: customerId
    })
      .sort({ createdAt: -1 });

    let balance = lastTransaction ? lastTransaction.balance : 0;
    
    if (type === 'received') {
      balance += amount;
    } else if (type === 'given') {
      balance -= amount;
    }

    const transaction = new Transaction({
      userId: req.user._id,
      customerId,
      type,
      amount,
      description: description || '',
      balance
    });

    await transaction.save();
    
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('customerId', 'name mobile');

    res.status(201).json(populatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get summary (total spent, received, sent)
router.get('/summary', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id });
    
    const summary = {
      totalReceived: 0,
      totalGiven: 0,
      currentBalance: 0
    };

    transactions.forEach(transaction => {
      if (transaction.type === 'received') {
        summary.totalReceived += transaction.amount;
      } else if (transaction.type === 'given') {
        summary.totalGiven += transaction.amount;
      }
    });

    // Get latest balance
    const lastTransaction = await Transaction.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    summary.currentBalance = lastTransaction ? lastTransaction.balance : 0;

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all transactions (Admin only) - MUST BE BEFORE /:id route
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const transactions = await Transaction.find()
      .populate('userId', 'name phone email')
      .populate('customerId', 'name mobile')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update transaction
router.put('/:id', auth, async (req, res) => {
  try {
    const { amount, description, date, time } = req.body;
    
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update transaction fields
    if (amount !== undefined) transaction.amount = amount;
    if (description !== undefined) transaction.description = description;
    
    // Update date and time if provided
    if (date || time) {
      let newDate = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
      
      if (date) {
        const dateParts = date.split('-');
        if (dateParts.length === 3) {
          newDate.setFullYear(parseInt(dateParts[0]));
          newDate.setMonth(parseInt(dateParts[1]) - 1);
          newDate.setDate(parseInt(dateParts[2]));
        }
      }
      
      if (time) {
        const timeParts = time.split(':');
        if (timeParts.length >= 2) {
          newDate.setHours(parseInt(timeParts[0]));
          newDate.setMinutes(parseInt(timeParts[1]));
          newDate.setSeconds(timeParts[2] ? parseInt(timeParts[2]) : 0);
        }
      }
      
      transaction.createdAt = newDate;
      transaction.updatedAt = new Date();
    }

    // Recalculate balance for all transactions of THIS CUSTOMER from the beginning
    const allTransactions = await Transaction.find({ 
      userId: req.user._id,
      customerId: transaction.customerId
    })
      .sort({ createdAt: 1 });
    
    let currentBalance = 0;
    for (const t of allTransactions) {
      if (t._id.toString() === transaction._id.toString()) {
        // Update this transaction's balance
        if (transaction.type === 'received') {
          currentBalance += transaction.amount;
        } else {
          currentBalance -= transaction.amount;
        }
        transaction.balance = currentBalance;
      } else {
        // Recalculate balance for all transactions of this customer
        if (t.type === 'received') {
          currentBalance += t.amount;
        } else {
          currentBalance -= t.amount;
        }
        t.balance = currentBalance;
        await t.save();
      }
    }
    
    await transaction.save();
    
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('customerId', 'name mobile');
    
    res.json(populatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const customerId = transaction.customerId;
    await Transaction.findByIdAndDelete(req.params.id);

    // Recalculate balances for remaining transactions of THIS CUSTOMER
    const allTransactions = await Transaction.find({ 
      userId: req.user._id,
      customerId: customerId
    })
      .sort({ createdAt: 1 });
    
    let currentBalance = 0;
    for (const t of allTransactions) {
      if (t.type === 'received') {
        currentBalance += t.amount;
      } else {
        currentBalance -= t.amount;
      }
      t.balance = currentBalance;
      await t.save();
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Share transaction history (creates shareable link)
router.post('/share/history', auth, async (req, res) => {
  try {
    const { mobileNumber, customerId } = req.body;
    
    if (!mobileNumber) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    const SharedLink = require('../models/SharedLink');
    const sharedLink = new SharedLink({
      userId: req.user._id,
      token,
      phoneNumber: mobileNumber,
      customerId: customerId || null // Store customerId if provided
    });

    await sharedLink.save();

    // Build share URL using request origin (works for both dev and production)
    // In production, both server and client are on same domain
    const protocol = req.protocol || (req.headers['x-forwarded-proto'] || 'http');
    const host = req.get('host') || req.headers.host || 'localhost:5000';
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;
    const shareUrl = `${baseUrl}/shared/${token}`;

    res.json({
      message: 'Shareable link created successfully',
      shareUrl,
      token,
      mobileNumber
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get shared link data (public route, no auth required)
router.get('/shared/:token', async (req, res) => {
  try {
    // Decode the token to handle URL encoding (e.g., %20 for spaces)
    const token = decodeURIComponent(req.params.token);
    
    const SharedLink = require('../models/SharedLink');
    const sharedLink = await SharedLink.findOne({ 
      token: token,
      expiresAt: { $gt: new Date() }
    });

    if (!sharedLink) {
      return res.status(404).json({ message: 'Shared link not found or expired' });
    }

    const User = require('../models/User');
    const user = await User.findById(sharedLink.userId).select('name phone');

    res.json({
      sharedLink: {
        token: sharedLink.token,
        phoneNumber: sharedLink.phoneNumber,
        expiresAt: sharedLink.expiresAt
      },
      user: {
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify phone and get transactions (public route)
router.post('/shared/:token/verify', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const SharedLink = require('../models/SharedLink');
    const sharedLink = await SharedLink.findOne({ 
      token: req.params.token,
      expiresAt: { $gt: new Date() }
    });

    if (!sharedLink) {
      return res.status(404).json({ message: 'Shared link not found or expired' });
    }

    // Verify phone number matches
    if (sharedLink.phoneNumber !== phoneNumber) {
      return res.status(401).json({ message: 'Invalid phone number' });
    }

    // Fetch transactions - if customerId is set, only fetch that customer's transactions
    let transactions;
    if (sharedLink.customerId) {
      transactions = await Transaction.find({ 
        userId: sharedLink.userId,
        customerId: sharedLink.customerId
      })
        .populate('customerId', 'name mobile')
        .sort({ createdAt: -1 });
    } else {
      transactions = await Transaction.find({ userId: sharedLink.userId })
        .populate('customerId', 'name mobile')
        .sort({ createdAt: -1 });
    }

    const User = require('../models/User');
    const user = await User.findById(sharedLink.userId).select('name phone');

    res.json({
      success: true,
      transactions,
      user: {
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payment methods for shared link (public route)
router.get('/shared/:token/payment-methods', async (req, res) => {
  try {
    // Decode the token to handle URL encoding
    const token = decodeURIComponent(req.params.token);
    
    const SharedLink = require('../models/SharedLink');
    const sharedLink = await SharedLink.findOne({ 
      token: token,
      expiresAt: { $gt: new Date() }
    });

    if (!sharedLink) {
      return res.status(404).json({ message: 'Shared link not found or expired' });
    }

    const PaymentMethod = require('../models/PaymentMethod');
    const paymentMethods = await PaymentMethod.find({ userId: sharedLink.userId })
      .sort({ isDefault: -1, createdAt: -1 });

    res.json(paymentMethods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Process payment (public route)
router.post('/shared/:token/payment', async (req, res) => {
  try {
    // Decode the token to handle URL encoding
    const token = decodeURIComponent(req.params.token);
    
    const { paymentMethodId, phoneNumber, amount, notes, paymentProof } = req.body;

    const SharedLink = require('../models/SharedLink');
    const sharedLink = await SharedLink.findOne({ 
      token: token,
      expiresAt: { $gt: new Date() }
    });

    if (!sharedLink) {
      return res.status(404).json({ message: 'Shared link not found or expired' });
    }

    // Verify phone number matches
    if (sharedLink.phoneNumber !== phoneNumber) {
      return res.status(401).json({ message: 'Invalid phone number' });
    }

    // Verify payment method belongs to the user
    const PaymentMethod = require('../models/PaymentMethod');
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      userId: sharedLink.userId
    });

    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    // Create payment record
    const Payment = require('../models/Payment');
    const payment = new Payment({
      userId: sharedLink.userId,
      sharedLinkToken: token,
      payerPhoneNumber: phoneNumber,
      amount: amount,
      paymentMethodId: paymentMethod._id,
      paymentMethodType: paymentMethod.type,
      paymentMethodDetails: {
        upiId: paymentMethod.upiId,
        label: paymentMethod.label
      },
      status: 'pending', // Set to pending for admin approval
      notes: notes || '',
      paymentProof: paymentProof || ''
    });

    await payment.save();

    // In a real application, you would integrate with payment gateway here
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Payment processed successfully',
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Share specific transaction entry
router.post('/share/entry/:id', auth, async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    
    if (!mobileNumber) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('customerId', 'name mobile');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({
      message: 'Transaction entry shared successfully',
      mobileNumber,
      transaction,
      user: {
        name: req.user.name,
        phone: req.user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

