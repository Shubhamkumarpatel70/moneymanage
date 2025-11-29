const mongoose = require('mongoose');

const contactPermissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  permissionGranted: {
    type: Boolean,
    default: false
  },
  contacts: [{
    name: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    accessedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastAccessed: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ContactPermission', contactPermissionSchema);

