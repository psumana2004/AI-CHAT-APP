const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/authMiddleware');
const { updateProfile, getCurrentUser } = require('../controllers/userController');


// Get current user info
router.get('/me', authMiddleware, getCurrentUser);

// Update profile (name + avatar)
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile);

module.exports = router;