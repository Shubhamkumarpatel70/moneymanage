const express = require('express');
const router = express.Router();
const PaymentMethod = require('../models/PaymentMethod');
const auth = require('../middleware/auth');

// Get all payment methods for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(paymentMethods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new payment method
router.post('/', auth, async (req, res) => {
  try {
    const { type, upiId, qrCode, label, isDefault } = req.body;

    if (!type || (type === 'upi' && !upiId) || (type === 'qr' && !qrCode)) {
      return res.status(400).json({ message: 'Type and corresponding data are required' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await PaymentMethod.updateMany(
        { userId: req.user._id },
        { isDefault: false }
      );
    }

    const paymentMethod = new PaymentMethod({
      userId: req.user._id,
      type,
      upiId: type === 'upi' ? upiId : '',
      qrCode: type === 'qr' ? qrCode : '',
      label: label || '',
      isDefault: isDefault || false
    });

    await paymentMethod.save();
    res.status(201).json(paymentMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update payment method
router.put('/:id', auth, async (req, res) => {
  try {
    const { upiId, qrCode, label, isDefault } = req.body;

    // Admin can update any payment method, users can only update their own
    const query = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user._id };

    const paymentMethod = await PaymentMethod.findOne(query);

    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    if (paymentMethod.type === 'upi' && upiId !== undefined) {
      paymentMethod.upiId = upiId;
    }
    if (paymentMethod.type === 'qr' && qrCode !== undefined) {
      paymentMethod.qrCode = qrCode;
    }
    if (label !== undefined) paymentMethod.label = label;
    if (isDefault !== undefined) {
      // If setting as default, unset other defaults
      if (isDefault) {
        await PaymentMethod.updateMany(
          { userId: req.user._id, _id: { $ne: req.params.id } },
          { isDefault: false }
        );
      }
      paymentMethod.isDefault = isDefault;
    }

    await paymentMethod.save();
    res.json(paymentMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete payment method
router.delete('/:id', auth, async (req, res) => {
  try {
    // Admin can delete any payment method, users can only delete their own
    const query = req.user.role === 'admin' 
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user._id };

    const paymentMethod = await PaymentMethod.findOneAndDelete(query);

    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all payment methods (Admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    const paymentMethods = await PaymentMethod.find()
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 });
    res.json(paymentMethods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

