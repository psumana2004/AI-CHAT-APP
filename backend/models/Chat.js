const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  isGroupChat: {
    type: Boolean,
    default: false
  },
  chatName: {
    type: String,
    trim: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isGroupChat: {
    type: Boolean,
    default: false
  },
  chatName: {
    type: String,
    trim: true
  },
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;