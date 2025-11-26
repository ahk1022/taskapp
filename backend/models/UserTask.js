const mongoose = require('mongoose');

const userTaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'verified'],
    default: 'pending'
  },
  reward: {
    type: Number,
    required: true
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index to prevent duplicate task completion
userTaskSchema.index({ user: 1, task: 1, createdAt: 1 });

module.exports = mongoose.model('UserTask', userTaskSchema);
