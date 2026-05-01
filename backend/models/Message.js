const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileType: {
    type: String,
    default: null
  },
  starred: {
    type: Boolean,
    default: false
  },
  starredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;