const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  mpin: {
    type: String,
    required: true
    // Note: minlength/maxlength removed because MPIN is hashed before saving (becomes 60 chars)
    // Validation for 4-digit MPIN is done in routes before hashing
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Hash MPIN before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('mpin')) return next();
  this.mpin = await bcrypt.hash(this.mpin, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Compare MPIN method
userSchema.methods.compareMPIN = async function(candidateMPIN) {
  return await bcrypt.compare(candidateMPIN, this.mpin);
};

module.exports = mongoose.model('User', userSchema);

