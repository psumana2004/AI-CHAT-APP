const express = require('express');
const { sendMessage, getMessages, toggleStar, getStarredMessages } = require('../controllers/messageController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/chat/:chatId', protect, getMessages);
router.patch('/:messageId/star', protect, toggleStar);
router.get('/starred', protect, getStarredMessages);

module.exports = router;
