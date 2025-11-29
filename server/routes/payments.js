const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');

// Get all payments for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('paymentMethodId', 'type upiId label')
      .sort({ createdAt: -1 });
    
    // Get user details for payer phone numbers
    const User = require('../models/User');
    const paymentsWithPayerDetails = await Promise.all(
      payments.map(async (payment) => {
        const payerUser = await User.findOne({ phone: payment.payerPhoneNumber }).select('name phone email');
        return {
          ...payment.toObject(),
          payerDetails: payerUser ? {
            name: payerUser.name,
            phone: payerUser.phone,
            email: payerUser.email
          } : null
        };
      })
    );
    
    res.json(paymentsWithPayerDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all payments (Admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const payments = await Payment.find()
      .populate('userId', 'name phone email')
      .populate('paymentMethodId', 'type upiId label')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payment summary for user
router.get('/summary', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id });
    
    const summary = {
      totalPayments: payments.length,
      totalAmount: 0,
      completed: 0,
      pending: 0,
      failed: 0
    };

    payments.forEach(payment => {
      if (payment.status === 'completed') {
        summary.totalAmount += payment.amount;
        summary.completed++;
      } else if (payment.status === 'pending') {
        summary.pending++;
      } else {
        summary.failed++;
      }
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve payment (User or Admin)
router.post('/:id/approve', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // User can only approve their own payments, admin can approve any
    if (req.user.role !== 'admin' && payment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only approve your own payments.' });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({ message: 'Payment already approved' });
    }

    payment.status = 'completed';
    await payment.save();

    // Create transaction for the user when payment is approved
    try {
      const Transaction = require('../models/Transaction');
      const SharedLink = require('../models/SharedLink');
      const Customer = require('../models/Customer');

      // Find the shared link to get customer info
      const sharedLink = await SharedLink.findOne({ token: payment.sharedLinkToken });
      
      let customer;
      if (sharedLink && sharedLink.customerId) {
        // Use the customer from shared link
        customer = await Customer.findById(sharedLink.customerId);
      }
      
      // If no customer from shared link, find or create by payer phone number
      if (!customer) {
        customer = await Customer.findOne({ 
          userId: payment.userId,
          mobile: payment.payerPhoneNumber 
        });

        if (!customer) {
          // Create customer if doesn't exist
          customer = new Customer({
            userId: payment.userId,
            name: payment.payerPhoneNumber, // Use phone as name if no name available
            mobile: payment.payerPhoneNumber
          });
          await customer.save();
        }
      }

      if (customer) {
        // Get the last transaction for THIS CUSTOMER to calculate balance per customer
        const lastTransaction = await Transaction.findOne({ 
          userId: payment.userId,
          customerId: customer._id
        })
          .sort({ createdAt: -1 });
        
        const currentBalance = lastTransaction ? lastTransaction.balance : 0;
        const newBalance = currentBalance + payment.amount;

        // Create transaction for received payment
        const transaction = new Transaction({
          userId: payment.userId,
          customerId: customer._id,
          type: 'received',
          amount: payment.amount,
          description: `Payment received via ${payment.paymentMethodType === 'upi' ? 'UPI' : 'QR Code'}`,
          balance: newBalance
        });

        await transaction.save();
      }
    } catch (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // Don't fail the payment approval if transaction creation fails
    }

    res.json({ 
      message: 'Payment approved successfully and transaction has been updated',
      payment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject payment (User or Admin)
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // User can only reject their own payments, admin can reject any
    if (req.user.role !== 'admin' && payment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only reject your own payments.' });
    }

    payment.status = 'failed';
    await payment.save();

    res.json({ 
      message: 'Payment rejected',
      payment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

