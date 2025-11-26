const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  tasksPerDay: {
    type: Number,
    required: true
  },
  rewardPerTask: {
    type: Number,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  totalEarnings: {
    type: Number,
    required: true
  },
  features: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Package', packageSchema);
