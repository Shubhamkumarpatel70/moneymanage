const mongoose = require('mongoose');

const sharedLinkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  customerId: { // Optional: If sharing specific customer's transactions
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SharedLink', sharedLinkSchema);

