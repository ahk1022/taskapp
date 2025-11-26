const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['watch_video', 'click_ad', 'survey', 'social_media', 'other'],
    default: 'other'
  },
  url: {
    type: String,
    required: false
  },
  duration: {
    type: Number, // in seconds
    default: 30
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
