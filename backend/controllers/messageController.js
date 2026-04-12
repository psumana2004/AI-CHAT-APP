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

module.exports = { sendMessage, getMessages };