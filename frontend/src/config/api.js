// API Configuration for different environments
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  
  // Chat
  GET_CHATS: `${API_BASE_URL}/api/chat`,
  GET_CHAT_MESSAGES: (chatId) => `${API_BASE_URL}/api/chat/${chatId}`,
  CREATE_CHAT: `${API_BASE_URL}/api/chat`,
  CREATE_GROUP_CHAT: `${API_BASE_URL}/api/chat/group`,
  DELETE_CHAT: (chatId) => `${API_BASE_URL}/api/chat/${chatId}`,
  
  // Messages
  SEND_MESSAGE: `${API_BASE_URL}/api/messages`,
  UPLOAD_FILE: `${API_BASE_URL}/api/messages/upload`,
  STAR_MESSAGE: (messageId) => `${API_BASE_URL}/api/messages/${messageId}/star`,
  GET_STARRED_MESSAGES: `${API_BASE_URL}/api/messages/starred`,
  
  // User
  UPDATE_PROFILE: `${API_BASE_URL}/api/users/profile`,
  
  // AI
  AI_ASK: `${API_BASE_URL}/api/ai/ask`,
  
  // Socket.io
  SOCKET_URL: API_BASE_URL,
  
  // File uploads
  UPLOADS_URL: `${API_BASE_URL}/uploads`,
  FILE_URL: (filePath) => `${API_BASE_URL}${filePath}`
};

export default API_ENDPOINTS;
