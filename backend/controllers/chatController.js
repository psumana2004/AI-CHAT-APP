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

module.exports = { accessChat, getChats };
