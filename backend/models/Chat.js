const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    consultationType: {
      type: String,
      enum: ['general', 'symptom', 'mental_health', 'medication'],
      default: 'general'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster chat history retrieval
chatSchema.index({ userId: 1, lastUpdated: -1 });

module.exports = mongoose.model('Chat', chatSchema); 