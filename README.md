# AI Chat Application

A real-time chat application with AI integration, file sharing, and WhatsApp-style features.

## Features

### 🚀 Core Features
- **Real-time Messaging**: Instant message delivery with Socket.io
- **AI Chat Integration**: Built-in AI assistant for conversations
- **File Attachments**: Share images, videos, documents, and other files
- **WhatsApp-style UI**: Modern interface with typing indicators and online status

### 💬 Chat Features
- **Typing Indicators**: See when someone is typing
- **Online/Offline Status**: Real-time user presence
- **Last Seen**: Track when users were last active
- **Unread Messages**: Message count badges
- **File Sharing**: Upload and download files
- **Image Previews**: Click to view full-size images

### 🛡️ User Management
- **Block/Unblock**: Long press to block users
- **Profile Management**: Edit name, email, and avatar
- **User Settings**: Theme switching and preferences
- **Mark All as Read**: Clear unread notifications

### 🎨 UI Features
- **Dark/Light Themes**: Multiple theme options
- **Responsive Design**: Works on desktop and mobile
- **WhatsApp-style Interface**: Familiar chat experience
- **Emoji Support**: Rich emoji picker
- **Smooth Animations**: Modern transitions and effects

## Tech Stack

### Frontend
- **React**: Modern JavaScript framework
- **Socket.io Client**: Real-time communication
- **Axios**: HTTP client for API calls
- **Tailwind CSS**: Utility-first CSS framework
- **React Hot Toast**: Notification system

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **Socket.io**: Real-time WebSocket server
- **MongoDB**: NoSQL database
- **Multer**: File upload handling
- **JWT**: Authentication tokens

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/psumana2004/AI-CHAT-APP.git
   cd AI-CHAT-APP
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # In backend folder
   cp .env.example .env
   
   # Edit .env with your MongoDB URI and other settings
   ```

4. **Start the application**
   ```bash
   # Start backend server
   cd backend
   npm run dev
   
   # Start frontend (in new terminal)
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Usage

1. **Create Account**: Register with email and password
2. **Start Chatting**: Add users by ID or create groups
3. **Share Files**: Click the 📎 button to attach files
4. **AI Assistant**: Click the 🤖 button for AI chat
5. **Block Users**: Long press on chat to block/unblock
6. **Customize**: Use settings menu to edit profile and theme

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Chats
- `GET /api/chat` - Get user chats
- `POST /api/chat` - Create new chat
- `DELETE /api/chat/:id` - Delete chat

### Messages
- `GET /api/messages/chat/:id` - Get chat messages
- `POST /api/messages` - Send message
- `POST /api/messages/upload` - Upload file

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

## Socket.io Events

### Client → Server
- `joinChat` - Join chat room
- `sendMessage` - Send message
- `typing` - Typing indicator
- `markMessagesAsRead` - Mark messages as read

### Server → Client
- `receiveMessage` - New message received
- `userTyping` - User typing indicator
- `userStatusUpdate` - User online/offline status
- `messagesRead` - Messages marked as read

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using React, Node.js, and Socket.io**
