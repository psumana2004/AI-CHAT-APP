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
  file: {
    url: {
      type: String,
      default: null
    },
    fileId: {
      type: String,
      default: null
    },
    name: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      default: null
    },
    type: {
      type: String,
      default: null
    }
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