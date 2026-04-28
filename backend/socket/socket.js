const { Server } = require('socket.io');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
      credentials: true
    },
    // Performance optimizations
    transports: ['websocket', 'polling'], // Prefer WebSocket for faster communication
    pingTimeout: 60000, // Increase timeout for better reliability
    pingInterval: 25000, // Reduce ping frequency for less overhead
    maxHttpBufferSize: 1e6, // Allow larger messages
    // Enable compression for faster data transfer
    compression: true
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
      try {
        if (!chatId) {
          console.error('❌ Invalid chat ID:', chatId);
          return;
        }

        socket.join(chatId);
        console.log(`✅ Joined chat room: ${chatId}`);
        console.log('🔍 Socket rooms after join:', socket.rooms);
      } catch (error) {
        console.error('❌ Socket joinChat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    socket.on('sendMessage', async (messageData) => {
      try {
        if (!messageData || !messageData.content || !messageData.chatId || !messageData.sender) {
          console.error('❌ Invalid message data:', messageData);
          return;
        }

        const { content, chatId, sender } = messageData;
        const timestamp = new Date();

        // Create message object for immediate broadcast
        const messageForBroadcast = {
          _id: `temp_${Date.now()}_${Math.random()}`, // Temporary ID
          content,
          chat: chatId,
          sender: {
            _id: sender,
            name: socket.handshake.auth.userName || 'Unknown User',
            avatar: socket.handshake.auth.userAvatar || null
          },
          createdAt: timestamp,
          updatedAt: timestamp
        };

        // Broadcast immediately for real-time delivery
        console.log(`📤 Broadcasting message instantly to room ${chatId}`);
        io.to(chatId).emit('receiveMessage', messageForBroadcast);

        // Save to database asynchronously (non-blocking)
        Message.create({ sender, content, chat: chatId })
          .then(async (savedMessage) => {
            await Chat.findByIdAndUpdate(chatId, { latestMessage: savedMessage._id });
            const populatedMessage = await savedMessage.populate('sender', 'name avatar');
            
            // Broadcast the confirmed message with real ID
            console.log(`📤 Broadcasting confirmed message to room ${chatId}`);
            io.to(chatId).emit('receiveMessage', populatedMessage);
          })
          .catch(error => {
            console.error('❌ Database save error:', error);
            // Optionally broadcast error to sender
            socket.emit('messageError', { message: 'Message failed to save' });
          });

      } catch (error) {
        console.error('❌ Socket sendMessage error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ chatId, userId, isTyping }) => {
      try {
        if (!chatId || !userId || typeof isTyping !== 'boolean') {
          console.error('❌ Invalid typing data:', { chatId, userId, isTyping });
          return;
        }

        console.log('📝 Typing event received:', { chatId, userId, isTyping, socketId: socket.id });
        socket.to(chatId).emit('userTyping', { chatId, userId, isTyping });
        console.log('📤 Broadcasted typing to room:', chatId);
      } catch (error) {
        console.error('❌ Socket typing error:', error);
        socket.emit('error', { message: 'Failed to broadcast typing' });
      }
    });

    socket.on('profileUpdated', (userData) => {
      // Broadcast profile update to all connected users
      socket.broadcast.emit('userProfileUpdated', userData);
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: false });
      }
      console.log('🔴 User disconnected');
    });
  });
};

const getIO = () => io;

module.exports = { initializeSocket, getIO };