const User = require('../models/User');

// Get socket.io instance to emit events
const { getIO } = require('../socket/socket');

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    let avatarUrl = null;

    if (req.file) {
      avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        name: name || undefined,
        avatar: avatarUrl || undefined 
      },
      { new: true }
    ).select('-password');

    // Emit profile update to all connected users
    const io = getIO();
    if (io) {
      console.log('📤 Emitting profile update to all users:', updatedUser);
      console.log('🔌 Socket.io instance available, connected clients:', io.sockets?.size || 'unknown');
      io.emit('userProfileUpdated', updatedUser);
      console.log('✅ Profile update emitted successfully');
    } else {
      console.log('❌ Socket.io not available for profile update');
      // Retry after a short delay
      setTimeout(() => {
        const retryIo = getIO();
        if (retryIo) {
          console.log('🔄 Retrying profile update emission');
          retryIo.emit('userProfileUpdated', updatedUser);
        }
      }, 1000);
    }

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};