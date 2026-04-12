const express = require('express');
const { accessChat, getChats } = require('../controllers/chatController');
const { sendMessage, getMessages } = require('../controllers/messageController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
const upload = require('../middleware/upload');


router.post('/', protect, accessChat);           // Create or get chat
router.get('/', protect, getChats);              // Get all chats of user

router.post('/message', protect, sendMessage);   // Send message
router.get('/:chatId', protect, getMessages);    // Get messages
router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  
  res.json({
    fileUrl: `/uploads/${req.file.filename}`,
    fileType: req.file.mimetype
  });
 });

module.exports = router;