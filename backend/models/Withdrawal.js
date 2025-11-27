const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  taxPercentage: {
    type: Number,
    default: 12
  },
  taxAmount: {
    type: Number,
    required: true
  },
  netAmount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['nayapay', 'jazzcash', 'easypaisa', 'raast', 'zindigi'],
    required: true
  },
  accountDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    phoneNumber: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  processedAt: {
    type: Date
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
