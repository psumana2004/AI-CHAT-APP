const Chat = require('../models/Chat');
const Message = require('../models/Message');


// Create or Get One-to-One Chat
const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: "UserId is required" });

    // Check if chat already exists
    let chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: [req.user._id, userId] }
    }).populate("participants", "name email avatar isOnline");

    if (chat) {
      return res.json(chat);
    }

    // Create new chat
    chat = await Chat.create({
      isGroupChat: false,
      participants: [req.user._id, userId]
    });

    chat = await chat.populate("participants", "name email avatar isOnline");

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*exports.deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findByIdAndDelete(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json({ message: "Chat deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};*/

// Get all chats of logged in user
const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "name email avatar isOnline")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Group Chat
const createGroupChat = async (req, res) => {
  try {
    const { name, users } = req.body;

    if (!name || !users) {
      return res.status(400).json({ message: "Group name and users are required" });
    }

    // Add current user to participants and ensure all are valid ObjectIds
    const mongoose = require('mongoose');
    const participants = [req.user._id, ...users.filter(id => mongoose.Types.ObjectId.isValid(id))];

    if (participants.length < 2) {
      return res.status(400).json({ message: "At least one valid user ID is required" });
    }

    // Create group chat
    const groupChat = await Chat.create({
      isGroupChat: true,
      chatName: name,
      participants: participants,
      groupAdmin: req.user._id
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("participants", "name email avatar isOnline")
      .populate("groupAdmin", "name email avatar");

    res.status(201).json(fullGroupChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Chat
const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findByIdAndDelete(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Also delete all messages in this chat
    await Message.deleteMany({ chat: req.params.chatId });

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { accessChat, getChats, createGroupChat, deleteChat };
