const express = require('express');
const multer = require('multer');
const path = require('path');
const { sendMessage, getMessages, toggleStar, getStarredMessages } = require('../controllers/messageController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 16 * 1024 * 1024 // 16MB limit like WhatsApp
  },
  fileFilter: function (req, file, cb) {
    // Accept all file types like WhatsApp
    cb(null, true);
  }
});

// File upload endpoint (WhatsApp-style)
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileUrl = `/uploads/${file.filename}`;
    
    console.log('📎 File uploaded successfully:', {
      originalname: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      url: fileUrl
    });

    res.json({ 
      url: fileUrl,
      fileId: file.filename,
      name: file.originalname,
      size: file.size,
      type: file.mimetype
    });
  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

router.post('/', protect, sendMessage);
router.get('/chat/:chatId', protect, getMessages);
router.patch('/:messageId/star', protect, toggleStar);
router.get('/starred', protect, getStarredMessages);

module.exports = router;
