const dotenv = require('dotenv');
dotenv.config();
const express = require('express');

const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { initializeSocket } = require('./socket/socket');
const aiRoutes = require('./routes/aiRoutes');



const app = express();
const server = require('http').createServer(app);

// ✅ Best CORS Configuration for Development
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);

app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('🚀 AI Chat App Backend is Running with Socket.io!');
});

// Initialize Socket.io
initializeSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Socket.io is ready`);
});