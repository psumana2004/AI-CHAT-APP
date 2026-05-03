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
      
      // Update user status to online
      await User.findByIdAndUpdate(userId, { 
        isOnline: true,
        lastSeen: new Date()
      });
      
      // Broadcast online status to all users
      io.emit('userStatusUpdate', {
        userId: userId,
        isOnline: true,
        lastSeen: new Date()
      });
      
      console.log(`User ${userId} is online`);
    });

    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`✅ Joined chat room: ${chatId}`);
    });

    socket.on('sendMessage', async (messageData) => {
      try {
        console.log('� sendMessage received:', messageData);
        
        // Extract message data (WhatsApp-style - now includes file URL if present)
        const { content, chatId, sender, file } = messageData;
        
        console.log('📤 Message data extracted:', {
          content,
          chatId,
          sender,
          hasFile: !!file
        });
        
        if (file) {
          console.log('� File data:', file);
        }
        
        const timestamp = new Date();

        // Create instant message for immediate broadcast
        const instantMessage = {
          _id: `instant_${Date.now()}_${Math.random()}`,
          content,
          chat: chatId,
          sender: {
            _id: sender,
            name: 'User', // Will be updated after population
            avatar: null
          },
          createdAt: timestamp,
          updatedAt: timestamp,
          file: file || null // WhatsApp-style - file contains URL and metadata
        };

        // 4-WAY BROADCAST SYSTEM
        console.log(`📤 4-WAY BROADCAST to room ${chatId}`);
        console.log('📤 Message being broadcast:', instantMessage);
        console.log('📤 File data in broadcast:', file);
        console.log('📤 Message has file:', !!file);
        if (file) {
          console.log('📤 File URL:', file.url);
          console.log('📤 File name:', file.name);
        }
        console.log('📤 Socket rooms:', socket.rooms);
        console.log('📤 All sockets in room:', io.sockets.adapter.rooms.get(chatId));
        
        // 1. Broadcast to sender's chat window (receiveMessage)
        io.to(chatId).emit('receiveMessage', instantMessage);
        console.log('📤 1️⃣ SENDER CHAT WINDOW broadcast completed');
        
        // 2. Broadcast to sender's chat list (updateSenderChatList)
        io.to(chatId).emit('updateSenderChatList', {
          chatId: chatId,
          latestMessage: instantMessage,
          senderId: sender,
          timestamp: timestamp,
          isSender: true
        });
        console.log('📤 2️⃣ SENDER CHAT LIST broadcast completed');
        
        // 3. Broadcast to other user's chat list (updateOtherUserChatList) with unread count increment
        socket.to(chatId).emit('updateOtherUserChatList', {
          chatId: chatId,
          latestMessage: instantMessage,
          senderId: sender,
          timestamp: timestamp,
          isOtherUser: true,
          unreadCountIncrement: 1 // Increment by 1 for recipient
        });
        console.log('📤 3️⃣ OTHER USER CHAT LIST broadcast completed');
        
        // 4. Broadcast to other user's chat window (receiveMessage for other user)
        socket.to(chatId).emit('receiveMessage', instantMessage);
        console.log('📤 4️⃣ OTHER USER CHAT WINDOW broadcast completed');
        
        // Also broadcast to all users for global chat list updates
        io.emit('updateAllChatLists', {
          chatId: chatId,
          latestMessage: instantMessage,
          senderId: sender,
          timestamp: timestamp
        });
        console.log('📤 🌐 GLOBAL CHAT LISTS broadcast completed');
        
        console.log('📤 4-WAY BROADCAST COMPLETED - All directions covered');

        // Save to database in background
        try {
          let messageData = { sender, content, chat: chatId };
          
          // Add file to message data if file exists (WhatsApp-style)
          if (file) {
            messageData.file = file;
          }
          
          const message = await Message.create(messageData);
          await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });
          
          const populatedMessage = await message.populate('sender', 'name avatar');
          
          // Add file information to populated message if file exists
          if (file) {
            populatedMessage.file = file;
          }
          
          // Broadcast the confirmed message with real data
          console.log(`📤 CONFIRMED 4-WAY BROADCAST to room ${chatId}`);
          console.log('📤 Confirmed message being broadcast:', populatedMessage);
          console.log('📤 Confirmed message has file:', !!populatedMessage.file);
          if (populatedMessage.file) {
            console.log('📤 Confirmed file URL:', populatedMessage.file.url);
            console.log('📤 Confirmed file name:', populatedMessage.file.name);
          }
          
          // 1. Broadcast to sender's chat window (receiveMessage)
          io.to(chatId).emit('receiveMessage', populatedMessage);
          console.log('📤 1️⃣ CONFIRMED SENDER CHAT WINDOW broadcast completed');
          
          // 2. Broadcast to sender's chat list (updateSenderChatList)
          io.to(chatId).emit('updateSenderChatList', {
            chatId: chatId,
            latestMessage: populatedMessage,
            senderId: sender,
            timestamp: new Date(),
            isSender: true
          });
          console.log('📤 2️⃣ CONFIRMED SENDER CHAT LIST broadcast completed');
          
          // 3. Broadcast to other user's chat list (updateOtherUserChatList) - NO unread count increment for confirmed message
          socket.to(chatId).emit('updateOtherUserChatList', {
            chatId: chatId,
            latestMessage: populatedMessage,
            senderId: sender,
            timestamp: new Date(),
            isOtherUser: true
            // No unreadCountIncrement - already incremented in instant message
          });
          console.log('📤 3️⃣ CONFIRMED OTHER USER CHAT LIST broadcast completed');
          
          // 4. Broadcast to other user's chat window (receiveMessage for other user)
          socket.to(chatId).emit('receiveMessage', populatedMessage);
          console.log('📤 4️⃣ CONFIRMED OTHER USER CHAT WINDOW broadcast completed');
          
          // Also broadcast to all users for global chat list updates
          io.emit('updateAllChatLists', {
            chatId: chatId,
            latestMessage: populatedMessage,
            senderId: sender,
            timestamp: new Date()
          });
          console.log('📤 🌐 CONFIRMED GLOBAL CHAT LISTS broadcast completed');
          
          console.log('📤 CONFIRMED 4-WAY BROADCAST COMPLETED');
        } catch (dbError) {
          console.error('Database save error:', dbError);
          // Keep the instant message even if DB fails
        }
      } catch (error) {
        console.error('Socket sendMessage error:', error);
      }
    });

    socket.on('typing', ({ chatId, userId, isTyping }) => {
      socket.to(chatId).emit('userTyping', { chatId, userId, isTyping });
    });

    // Handle marking messages as read
    socket.on('markMessagesAsRead', async ({ chatId, userId }) => {
      try {
        console.log(`📖 Marking messages as read for chat ${chatId} by user ${userId}`);
        
        // Update unread count in database (you'll need to implement this model)
        // For now, broadcast that messages are read
        socket.to(chatId).emit('messagesRead', {
          chatId: chatId,
          userId: userId,
          unreadCount: 0
        });
        
        console.log('📖 Messages marked as read broadcast completed');
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(socket.userId, { 
          isOnline: false,
          lastSeen: lastSeen
        });
        
        // Broadcast offline status to all users
        io.emit('userStatusUpdate', {
          userId: socket.userId,
          isOnline: false,
          lastSeen: lastSeen
        });
      }
      console.log('🔴 User disconnected');
    });
  });
};

module.exports = { initializeSocket };