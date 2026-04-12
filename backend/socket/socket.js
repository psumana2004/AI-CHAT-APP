const { Server } = require('socket.io');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);

    socket.on('joinUser', async (userId) => {
      socket.userId = userId;
      socket.join(userId);
      await User.findByIdAndUpdate(userId, { isOnline: true });
      console.log(`User ${userId} is online`);
    });

    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`✅ Joined chat room: ${chatId}`);
    });

    socket.on('sendMessage', async (messageData) => {
      try {
        const { content, chatId, sender } = messageData;

        const message = await Message.create({ sender, content, chat: chatId });
        await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

        const populatedMessage = await message.populate('sender', 'name avatar');

        console.log(`📤 Broadcasting message to room ${chatId}`);
        io.to(chatId).emit('receiveMessage', populatedMessage);
      } catch (error) {
        console.error('Socket sendMessage error:', error);
      }
    });

    socket.on('typing', ({ chatId, userId, isTyping }) => {
      socket.to(chatId).emit('userTyping', { chatId, userId, isTyping });
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: false });
      }
      console.log('🔴 User disconnected');
    });
  });
};

module.exports = { initializeSocket };