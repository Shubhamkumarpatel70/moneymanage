const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedLinkToken: {
    type: String,
    required: true
  },
  payerPhoneNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: true
  },
  paymentMethodType: {
    type: String,
    enum: ['upi', 'qr'],
    required: true
  },
  paymentMethodDetails: {
    upiId: String,
    label: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  notes: {
    type: String,
    trim: true
  },
  paymentProof: {
    type: String, // Store as base64 or URL
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);

