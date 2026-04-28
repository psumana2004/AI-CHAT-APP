const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    // Don't exit the process, just log the error and continue
    // The server can still run without database for development
    console.log('⚠️ Server continuing without database connection...');
  }
};

module.exports = connectDB;