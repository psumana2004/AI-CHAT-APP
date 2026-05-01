import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'react-hot-toast';
import AIChat from '../components/AIChat';
import GroupModal from "../components/GroupModal";
import CreateChatModal from "../components/CreateChatModal";
import SettingsMenu from "../components/SettingsMenu";

let socket;

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [userIdInput, setUserIdInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const messagesEndRef = useRef(null);

  // Effect to update token and currentUser when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const currentToken = localStorage.getItem('token');
      const currentUserData = JSON.parse(localStorage.getItem('user'));
      
      setToken(currentToken);
      if (currentUserData) {
        setCurrentUser(currentUserData);
      }
    };

    // Check immediately
    checkAuth();

    // Set up interval to check for changes (polling approach)
    const interval = setInterval(checkAuth, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleProfileUpdate = async (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const onEmojiClick = (emojiObject) => {
    const emoji = emojiObject.emoji;
    setNewMessage(prev => prev + emoji);
  };

  const toggleStarMessage = async (messageId) => {
    try {
      const response = await axios.patch(`http://localhost:5000/api/messages/${messageId}/star`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the message in the local state
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? response.data : msg
      ));
    } catch (error) {
      console.error('Error toggling star:', error);
      toast.error('Failed to star message');
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    
    socket = io('http://localhost:5000');

    socket.emit('joinUser', currentUser.id);

    socket.on('receiveMessage', (newMsg) => {
      console.log('📨 REAL-TIME MESSAGE RECEIVED:', newMsg);

      if (selectedChat && newMsg.chat === selectedChat._id) {
        setMessages(prev => {
          // Check if message already exists (to prevent duplicates)
          const messageExists = prev.some(msg => msg._id === newMsg._id);
          if (messageExists) {
            // Update existing message if it's a temporary one
            return prev.map(msg => 
              msg._id === newMsg._id ? newMsg : msg
            );
          } else {
            // Add new message
            return [...prev, newMsg];
          }
        });
      }

      fetchChats();
    });

    socket.on('userTyping', ({ chatId, userId, isTyping }) => {
      console.log('📝 Typing event received:', { chatId, userId, isTyping, selectedChatId: selectedChat?._id });
      if (selectedChat && chatId === selectedChat._id) {
        console.log('✅ Updating typing state for user:', userId, 'isTyping:', isTyping);
        setTypingUsers(prev => ({ ...prev, [userId]: isTyping }));
      }
    });

    socket.on('userProfileUpdated', (updatedUser) => {
      console.log('👤 Profile update received:', updatedUser);
      console.log('🆔 Current user ID:', currentUser?.id);
      
      if (updatedUser._id === currentUser?.id) {
        console.log('✅ Updating current user state');
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      console.log('🔄 Updating chats participants...');
      setChats(prev => {
        const updatedChats = prev.map(chat => ({
          ...chat,
          participants: chat.participants?.map(p => 
            p._id === updatedUser._id ? updatedUser : p
          )
        }));
        console.log('📋 Updated chats:', updatedChats);
        console.log('🔍 Updated user data:', updatedUser);
        return updatedChats;
      });
      
      console.log('💬 Updating messages...');
      setMessages(prev => {
        const updatedMessages = prev.map(msg => ({
          ...msg,
          sender: msg.sender._id === updatedUser._id ? updatedUser : msg.sender
        }));
        console.log('📝 Updated messages:', updatedMessages);
        return updatedMessages;
      });
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [currentUser?.id]);

  const fetchChats = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/chat', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handleDeleteChat = async (chatId) => {
    if (!chatId) {
      toast.error("No chat selected");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this chat? This action cannot be undone.");

    if (!confirmDelete) return;

    try {
      const res = await axios.delete(
        `http://localhost:5000/api/chat/${chatId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      toast.success("Chat deleted successfully");

      fetchChats();

      if (selectedChat && selectedChat._id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to delete chat");
    }
  };

  const toggleTheme = () => {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    let newTheme;
    
    if (currentTheme === 'dark') {
      newTheme = 'light';
    } else if (currentTheme === 'light') {
      newTheme = 'ocean';
    } else {
      newTheme = 'dark';
    }
    
    // Remove all theme classes
    document.documentElement.classList.remove('dark', 'light', 'ocean');
    document.body.classList.remove('dark', 'light', 'ocean');
    
    // Add new theme class
    document.documentElement.classList.add(newTheme);
    document.body.classList.add(newTheme);
    
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    // Remove all theme classes
    document.documentElement.classList.remove('dark', 'light', 'ocean');
    document.body.classList.remove('dark', 'light', 'ocean');
    
    // Add saved theme class
    document.documentElement.classList.add(savedTheme);
    document.body.classList.add(savedTheme);
  }, []);

  useEffect(() => {
    if (selectedChat && socket) {
      socket.emit('joinChat', selectedChat._id);
      fetchMessages(selectedChat._id);
    }
  }, [selectedChat]);

  // Handle navigation to specific message from starred messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chatId');
    const messageId = urlParams.get('messageId');
    
    // If chatId is provided and we have chats, select that chat
    if (chatId && chats.length > 0 && !selectedChat) {
      const targetChat = chats.find(chat => chat._id === chatId);
      if (targetChat) {
        setSelectedChat(targetChat);
      }
    }
    
    // If messageId is provided and we have messages, scroll to that message
    if (messageId && messages.length > 0) {
      // Find the message element
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        // Scroll to the message
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight effect
        messageElement.classList.add('ring-2', 'ring-yellow-500', 'ring-opacity-50');
        setTimeout(() => {
          messageElement.classList.remove('ring-2', 'ring-yellow-500', 'ring-opacity-50');
        }, 2000);
      }
    }
  }, [chats, messages, selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createNewChat = async () => {
    if (!userIdInput) return toast.error("Enter User ID");
    try {
      const { data } = await axios.post('http://localhost:5000/api/chat', 
        { userId: userIdInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Chat created!");
      setShowNewChat(false);
      setUserIdInput('');
      fetchChats();
      setSelectedChat(data);
    } catch (error) {
      toast.error("Failed to create chat");
    }
  };

  let typingTimeout;

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
  
    if (selectedChat && socket) {
      // Clear existing timeout
      clearTimeout(typingTimeout);
      
      // Emit typing immediately
      socket.emit('typing', { 
        chatId: selectedChat._id, 
        userId: currentUser.id, 
        isTyping: true 
      });
      
      // Set timeout to stop typing after 1 second of inactivity
      typingTimeout = setTimeout(() => {
        if (socket) socket.emit('typing', { 
          chatId: selectedChat._id, 
          userId: currentUser.id, 
          isTyping: false 
        });
      }, 1000);
    }
  };

  const stopTyping = () => {
    clearTimeout(typingTimeout);
    
    if (selectedChat && socket) {
      socket.emit('typing', { 
        chatId: selectedChat._id, 
        userId: currentUser.id, 
        isTyping: false 
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !socket) return;

    const messageData = {
      content: newMessage,
      chatId: selectedChat._id,
      sender: currentUser.id
    };

    // Send via socket
    socket.emit('sendMessage', messageData);

    // Clear input immediately
    setNewMessage('');
  };

  return (
    <div className="h-screen flex bg-gray-950 overflow-hidden">
      <div className="w-80 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                {currentUser?.avatar ? (
                  <img 
                    src={currentUser.avatar.includes('http') ? currentUser.avatar : `http://localhost:5000/uploads/${currentUser.avatar}`}
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-white">{currentUser?.name || "User"}</p>
                <p className="text-xs text-gray-400">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAIChat(true)}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white p-2 rounded-lg transition-all"
                title="Ask AI"
              >
                🤖
              </button>
              <SettingsMenu 
                user={currentUser}
                currentChatId={selectedChat?._id}
                onDeleteCurrentChat={handleDeleteChat}
                onProfileUpdate={handleProfileUpdate}
                onToggleTheme={toggleTheme}
              />
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-3">Chats</h1>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setShowNewChat(true)}
              className="flex-1 bg-blue-600 py-2 rounded-xl"
            >
              + New Chat
            </button>
            <button
              onClick={() => setShowGroupModal(true)}
              className="flex-1 bg-green-600 py-2 rounded-xl"
            >
              + New Group
            </button>
          </div>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {chats.filter(chat => {
            const other = chat.participants?.find(p => p._id !== currentUser.id);
            return other?.name?.toLowerCase().includes(searchTerm.toLowerCase());
          }).map(chat => {
            const isGroup = chat.isGroupChat;
            const chatName = isGroup
              ? chat.chatName
              : chat.participants?.find(p => p._id !== currentUser.id)?.name;
            return (
              <div
                key={chat._id}
                onClick={() => setSelectedChat(chat)}
                className={`p-3 rounded-2xl cursor-pointer hover:bg-gray-900 transition-all ${
                  selectedChat?._id === chat._id ? 'bg-gray-900 border border-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                    {isGroup ? (
                      <span className="text-2xl">👥</span>
                    ) : (
                      (() => {
                        const otherUser = chat.participants?.find(p => p._id !== currentUser.id);
                        return otherUser?.avatar ? (
                          <img 
                            src={otherUser.avatar.includes('http') ? `${otherUser.avatar}?t=${Date.now()}` : `http://localhost:5000/uploads/${otherUser.avatar}?t=${Date.now()}`}
                            alt={otherUser.name || "Profile"} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('❌ Failed to load avatar:', e.target.src);
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-2xl">👤</span>
                        );
                      })()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{chatName}</p>
                    <p className="text-sm text-gray-400 truncate">
                      {chat.latestMessage?.content || "Start chatting..."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                  {(() => {
                    const otherUser = selectedChat.participants?.find(p => p._id !== currentUser.id);
                    return otherUser?.avatar ? (
                      <img 
                        src={otherUser.avatar.includes('http') ? `${otherUser.avatar}?t=${Date.now()}` : `http://localhost:5000/uploads/${otherUser.avatar}?t=${Date.now()}`}
                        alt={otherUser.name || "Profile"} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    );
                  })()}
                </div>
                <h2 className="font-semibold">
                  {selectedChat.participants?.find(p => p._id !== currentUser.id)?.name}
                </h2>
              </div>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
                    handleDeleteChat(selectedChat._id);
                  }
                }}
                className="text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-gray-800 transition-all text-sm font-medium"
                title="Delete Chat"
              >
                Delete Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-950">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  id={`message-${msg._id}`}
                  className={`flex ${msg.sender._id === currentUser.id ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className={`max-w-[65%] px-5 py-3 rounded-3xl relative transition-all ${
                    msg.sender._id === currentUser.id ? 'bg-blue-600 text-white' : 'bg-gray-800'
                  }`}>
                    <button
                      onClick={() => toggleStarMessage(msg._id)}
                      className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
                        msg.starred ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-400 hover:text-yellow-400'
                      }`}
                      title={msg.starred ? "Unstar message" : "Star message"}
                    >
                      {msg.starred ? '⭐' : '☆'}
                    </button>
                    <p>{msg.content}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {Object.entries(typingUsers)
              .filter(([userId, isTyping]) => isTyping && userId !== currentUser.id)
              .map(([userId]) => {
                const user = selectedChat?.participants?.find(p => p._id === userId);
                return (
                  <div key={userId} className="px-6 pb-3 text-sm text-blue-400 flex items-center gap-2 animate-pulse">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span>{user?.name || "Someone"} is typing...</span>
                  </div>
                );
              })}

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 bg-gray-900">
              <div className="flex gap-3 items-end">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-4 text-2xl text-gray-400 hover:text-yellow-400 hover:bg-gray-700 rounded-full transition-all"
                    title="Add emoji"
                  >
                    😊
                  </button>
                  
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 z-50">
                      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700">
                        <EmojiPicker
                          onEmojiClick={onEmojiClick}
                          theme={document.documentElement.classList.contains('light') ? 'light' : 'dark'}
                          height={450}
                          width={400}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onBlur={stopTyping}
                  onKeyUp={stopTyping}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-6 py-4 focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-12 py-4 rounded-full font-semibold text-lg transition">
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
            Select a chat to start messaging
          </div>
        )}
      </div>

      <CreateChatModal
        show={showNewChat}
        setShow={setShowNewChat}
        token={token}
        setSelectedChat={setSelectedChat}
        fetchChats={fetchChats}
      />
      
      <GroupModal
        show={showGroupModal}
        setShow={setShowGroupModal}
        token={token}
        fetchChats={fetchChats}
      />
      
      {showAIChat && (
        <AIChat
          onClose={() => setShowAIChat(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default Chat;
