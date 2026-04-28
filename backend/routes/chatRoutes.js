const express = require('express');
const { accessChat, getChats, createGroupChat, deleteChat } = require('../controllers/chatController');
const { sendMessage, getMessages } = require('../controllers/messageController');
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

// Chat routes
router.post('/', protect, accessChat);           // Create or get one-to-one chat
router.post('/group', protect, createGroupChat); // Create group chat
router.get('/', protect, getChats);              // Get all chats of user
router.delete('/:chatId', protect, deleteChat);  // Delete chat

// Message routes
router.post('/message', protect, sendMessage);    // Send message
router.get('/:chatId', protect, getMessages);    // Get messages

// File upload route
router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  
  res.json({
    fileUrl: `/uploads/${req.file.filename}`,
    fileType: req.file.mimetype
  });
});

module.exports = router;