const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['task_reward', 'referral_bonus', 'package_purchase', 'withdrawal'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  description: {
    type: String
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  relatedPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package'
  },
  paymentProof: {
    type: String, // URL to uploaded image or base64 string
  },
  transactionId: {
    type: String, // Transaction/Reference ID from payment gateway
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
