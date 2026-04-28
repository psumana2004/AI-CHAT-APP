const Message = require('../models/Message');
const Chat = require('../models/Chat');

const sendMessage = async (req, res) => {
  try {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
      return res.status(400).json({ message: "Content and chatId are required" });
    }

    const message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId
    });

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message._id
    });

    const populatedMessage = await message.populate('sender', 'name avatar');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== CREATE CHAT ====================
exports.createChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user.id;

    // Check if chat already exists between these two users
    let chat = await Chat.findOne({
      participants: { $all: [userId, participantId] },
      isGroup: false
    });

    if (chat) {
      return res.json(chat);
    }

    // Create new chat
    chat = await Chat.create({
      participants: [userId, participantId],
      isGroup: false
    });

    const populatedChat = await chat.populate('participants', 'name avatar');
    
    res.status(201).json(populatedChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create chat" });
  }
};

// ==================== DELETE CHAT ====================
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is part of this chat
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: "You are not authorized to delete this chat" });
    }

    // Delete all messages in this chat
    await Message.deleteMany({ chat: chatId });

    // Delete the chat itself
    await Chat.findByIdAndDelete(chatId);

    // Notify other users via socket (real-time update)
    req.io.to(chatId).emit('chatDeleted', chatId);

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete chat" });
  }
};

module.exports = { sendMessage, getMessages };