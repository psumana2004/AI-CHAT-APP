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
  const [userStatuses, setUserStatuses] = useState({}); // Track online/offline status
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const messagesEndRef = useRef(null);

  // Helper function to format last seen time
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return '';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

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

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAttachedFile(file);
      console.log('📎 File selected:', file);
      toast.success(`File attached: ${file.name}`);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    toast.success('File removed');
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

    socket.on('connect', () => {
      console.log('🟢 SOCKET CONNECTED:', socket.id);
      socket.emit('joinUser', currentUser.id);
    });

    socket.on('disconnect', () => {
      console.log('🔴 SOCKET DISCONNECTED');
    });

    socket.on('receiveMessage', (newMsg) => {
      console.log('📨 REAL-TIME MESSAGE RECEIVED:', newMsg);
      console.log('🎯 Current selected chat:', selectedChat?._id);
      console.log('📨 Message chat ID:', newMsg.chat);
      console.log('👤 Current user ID:', currentUser.id);
      console.log('📨 Message sender ID:', newMsg.sender?._id);
      console.log('📨 Message ID:', newMsg._id);
      console.log('📨 Is instant message?', newMsg._id.startsWith('instant_'));
      console.log('📨 Current messages count:', messages.length);

      // AGGRESSIVE APPROACH: Always try to display messages for real-time experience
      if (selectedChat) {
        console.log('🎯 SELECTED CHAT EXISTS - Attempting to add message');
        
        // Check if message belongs to current chat
        const belongsToCurrentChat = newMsg.chat === selectedChat._id;
        console.log('🎯 Message belongs to current chat:', belongsToCurrentChat);
        
        // FOR RECIPIENTS: Always add message if it's from another user
        const isFromOtherUser = newMsg.sender._id !== currentUser.id;
        console.log('🎯 Is message from other user?', isFromOtherUser);
        
        if (belongsToCurrentChat || (isFromOtherUser && selectedChat)) {
          console.log('✅ ADDING MESSAGE TO CURRENT CHAT');
          setMessages(prev => {
            console.log('🎯 PREV MESSAGES COUNT:', prev.length);
            
            // Check if this is a confirmed message replacing an instant one
            if (!newMsg._id.startsWith('instant_')) {
              const instantMessageIndex = prev.findIndex(msg => 
                msg._id.startsWith('instant_') && 
                msg.content === newMsg.content &&
                msg.sender._id === newMsg.sender._id
              );
              
              if (instantMessageIndex !== -1) {
                console.log('🔄 REPLACING INSTANT MESSAGE WITH CONFIRMED');
                const newMessages = [...prev];
                newMessages[instantMessageIndex] = newMsg;
                return newMessages;
              }
            }
            
            // Check for duplicates
            const messageExists = prev.some(msg => msg._id === newMsg._id);
            if (messageExists) {
              console.log('🔄 MESSAGE ALREADY EXISTS - UPDATING');
              return prev.map(msg => msg._id === newMsg._id ? newMsg : msg);
            }
            
            // Add new message
            console.log('➕ ADDING NEW MESSAGE');
            const newMessages = [...prev, newMsg];
            console.log('🎯 NEW MESSAGES COUNT:', newMessages.length);
            console.log('🎯 MESSAGE ADDED FOR:', isFromOtherUser ? 'RECIPIENT' : 'SENDER');
            return newMessages;
          });
        } else {
          console.log('❌ MESSAGE DOES NOT BELONG TO CURRENT CHAT');
          console.log('❌ Expected chat ID:', selectedChat._id);
          console.log('❌ Received chat ID:', newMsg.chat);
          console.log('❌ Chat ID types:', typeof selectedChat._id, typeof newMsg.chat);
          console.log('❌ String comparison:', String(selectedChat._id) === String(newMsg.chat));
          
          // FORCE ADD FOR RECIPIENTS: If message is from other user, add it anyway
          if (isFromOtherUser) {
            console.log('🔥 FORCE ADDING MESSAGE FOR RECIPIENT (CHAT ID MISMATCH)');
            setMessages(prev => {
              console.log('🔥 FORCE ADD - PREV COUNT:', prev.length);
              const newMessages = [...prev, newMsg];
              console.log('🔥 FORCE ADD - NEW COUNT:', newMessages.length);
              return newMessages;
            });
          }
        }
      } else {
        console.log('❌ NO SELECTED CHAT - CANNOT ADD MESSAGE');
      }

      // Don't call fetchChats() here - it might reset unread count from server
    });

    // Handle chat list updates for real-time synchronization
    socket.on('updateChatList', (chatUpdate) => {
      console.log('📋 CHAT LIST UPDATE RECEIVED:', chatUpdate);
      console.log('📋 Chat ID:', chatUpdate.chatId);
      console.log('📋 Latest message:', chatUpdate.latestMessage);
      
      // Don't fetchChats() here - it might reset unread count from server
      // Instead, only update the specific chat in the local state
      setChats(prev => prev.map(chat => {
        if (chat._id === chatUpdate.chatId) {
          console.log('📋 UPDATING CHAT IN LIST:', chat._id);
          return {
            ...chat,
            latestMessage: chatUpdate.latestMessage
          };
        }
        return chat;
      }));
    });

    // Handle other user's chat list updates (4-way broadcasting) - CRITICAL FOR UNREAD COUNTS
    socket.on('updateOtherUserChatList', (chatUpdate) => {
      console.log('📋 3️⃣ OTHER USER CHAT LIST UPDATE RECEIVED:', chatUpdate);
      console.log('📋 Chat ID:', chatUpdate.chatId);
      console.log('📋 Latest message:', chatUpdate.latestMessage);
      console.log('📋 Is other user:', chatUpdate.isOtherUser);
      console.log('📋 Unread count increment:', chatUpdate.unreadCountIncrement);
      
      // Update the specific chat in the chats array if it exists
      setChats(prev => {
        console.log('📋 PREVIOUS CHATS STATE:', prev.map(c => ({ id: c._id, unreadCount: c.unreadCount })));
        
        const newChats = prev.map(chat => {
          if (chat._id === chatUpdate.chatId) {
            console.log('📋 UPDATING OTHER USER CHAT IN LIST:', chat._id);
            const currentCount = chat.unreadCount || 0;
            
            // Only increment if unreadCountIncrement is provided (instant message)
            // For confirmed messages, just update the latest message without changing count
            const newCount = chatUpdate.unreadCountIncrement !== undefined 
              ? currentCount + (chatUpdate.unreadCountIncrement || 0)
              : currentCount;
              
            console.log('📋 Current count:', currentCount, 'Increment:', chatUpdate.unreadCountIncrement, 'New count:', newCount);
            console.log('📋 Chat update object:', chatUpdate);
            
            return {
              ...chat,
              latestMessage: chatUpdate.latestMessage,
              unreadCount: newCount
            };
          }
          return chat;
        });
        
        console.log('📋 NEW CHATS STATE:', newChats.map(c => ({ id: c._id, unreadCount: c.unreadCount })));
        return newChats;
      });
    });

    // Handle all chat lists updates for global synchronization
    socket.on('updateAllChatLists', (chatUpdate) => {
      console.log('📋 ALL CHAT LISTS UPDATE RECEIVED:', chatUpdate);
      console.log('📋 Chat ID:', chatUpdate.chatId);
      console.log('📋 Latest message:', chatUpdate.latestMessage);
      console.log('📋 Sender ID:', chatUpdate.senderId);
      
      // Update the specific chat in the chats array if it exists
      setChats(prev => prev.map(chat => {
        if (chat._id === chatUpdate.chatId) {
          console.log('📋 UPDATING CHAT IN ALL LISTS:', chat._id);
          return {
            ...chat,
            latestMessage: chatUpdate.latestMessage
          };
        }
        return chat;
      }));
    });

    // Handle sender's chat list updates (4-way broadcasting)
    socket.on('updateSenderChatList', (chatUpdate) => {
      console.log('📋 2️⃣ SENDER CHAT LIST UPDATE RECEIVED:', chatUpdate);
      console.log('📋 Chat ID:', chatUpdate.chatId);
      console.log('📋 Latest message:', chatUpdate.latestMessage);
      console.log('📋 Is sender:', chatUpdate.isSender);
      
      // Don't fetchChats() here - it might reset unread count from server
      // Instead, only update the specific chat in the local state
      setChats(prev => prev.map(chat => {
        if (chat._id === chatUpdate.chatId) {
          console.log('📋 UPDATING SENDER CHAT IN LIST:', chat._id);
          return {
            ...chat,
            latestMessage: chatUpdate.latestMessage
          };
        }
        return chat;
      }));
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
    setToken(null);
    setCurrentUser(null);
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleMarkAllAsRead = () => {
    console.log('📖 Marking all messages as read');
    
    // Reset all unread counts to 0
    setChats(prev => prev.map(chat => ({
      ...chat,
      unreadCount: 0
    })));
    
    // Show success message
    toast.success("All messages marked as read");
    
    // Optionally emit to server if needed
    if (socket) {
      // You could emit an event to server to mark messages as read in database
      // socket.emit('markAllAsRead', { userId: currentUser.id });
    }
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
      console.log('🏠 JOINING CHAT ROOM:', selectedChat._id);
      console.log('🔗 Socket connected:', socket.connected);
      console.log('👤 Current user:', currentUser.id);
      console.log('📡 Socket transport:', socket.io.engine.transport.name);
      
      // Join chat room immediately
      socket.emit('joinChat', selectedChat._id);
      
      // Listen for confirmation that we joined the room
      socket.on('joinedChat', (chatId) => {
        console.log('✅ CONFIRMED JOINED CHAT ROOM:', chatId);
        console.log('🔍 Socket rooms after join:', socket.rooms);
      });
      
      // Also listen for any errors
      socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });
      
      // Fetch messages after joining
      fetchMessages(selectedChat._id);
      
      // Force a check of socket connection after a short delay
      setTimeout(() => {
        console.log('🔍 Socket connection check after 500ms:', socket.connected);
        console.log('🔍 Socket rooms:', socket.rooms);
      }, 500);
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
    if (!newMessage.trim() && !attachedFile) return;
    if (!selectedChat || !socket) return;

    let fileData = null;

    // WhatsApp-style: Upload file first if attached
    if (attachedFile) {
      try {
        console.log('📎 Uploading file first (WhatsApp-style):', attachedFile.name);
        
        const formData = new FormData();
        formData.append('file', attachedFile);
        
        const response = await axios.post('http://localhost:5000/api/messages/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        
        fileData = response.data;
        console.log('✅ File uploaded successfully:', fileData);
        
      } catch (error) {
        console.error('❌ File upload failed:', error);
        toast.error('Failed to upload file');
        return;
      }
    }

    // Create message data with file URL (WhatsApp-style)
    const messageData = {
      content: newMessage,
      chatId: selectedChat._id,
      sender: currentUser.id,
      file: fileData // Contains URL and metadata
    };

    console.log('📤 SENDING MESSAGE (WhatsApp-style):', messageData);
    console.log('🔗 Socket connected:', socket.connected);

    // Add message immediately to local state for instant display
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      content: newMessage,
      sender: {
        _id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      chat: selectedChat._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      file: fileData // WhatsApp-style - contains URL and metadata
    };

    console.log('➕ Adding message to local state:', tempMessage);
    console.log('📊 Current messages count before adding:', messages.length);
    
    setMessages(prev => {
      console.log('📊 Previous messages:', prev.length);
      const newMessages = [...prev, tempMessage];
      console.log('📊 New messages count after adding:', newMessages.length);
      console.log('📊 Last message added:', newMessages[newMessages.length - 1]);
      return newMessages;
    });

    // Send via Socket.io (WhatsApp-style - with file URL)
    try {
      socket.emit('sendMessage', messageData);
      console.log('✅ Message sent via Socket.io');
      
      // Clear inputs
      setNewMessage('');
      setAttachedFile(null);
      
      toast.success('Message sent successfully');
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message');
    }
    
    // Add debugging to check if messages are rendered
    setTimeout(() => {
      console.log('🔍 Checking messages after 100ms:', messages.length);
      console.log('🔍 Last message content:', messages[messages.length - 1]?.content);
    }, 100);
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
                onMarkAllAsRead={handleMarkAllAsRead}
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
          }).map((chat) => {
            const isGroup = chat.isGroup || chat.chatName;
            const chatName = isGroup
              ? chat.chatName
              : chat.participants?.find(p => p._id !== currentUser.id)?.name;
            const participant = chat.participants?.find(p => p._id !== currentUser.id);
            const userStatus = isGroup ? null : userStatuses[participant?._id];
            const isTyping = typingUsers[participant?._id];
            const messageTime = chat.latestMessage?.createdAt 
              ? new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';
            
            return (
              <div
                key={chat._id}
                onClick={() => {
                  console.log('🖱️ CHAT SELECTED:', chat._id);
                  console.log('🖱️ CHAT OBJECT:', chat);
                  console.log('🖱️ PREVIOUS SELECTED CHAT:', selectedChat?._id);
                  
                  // Mark messages as read when opening chat
                  if (socket && chat._id !== selectedChat?._id) {
                    console.log('📖 MARKING MESSAGES AS READ FOR CHAT:', chat._id);
                    socket.emit('markMessagesAsRead', {
                      chatId: chat._id,
                      userId: currentUser.id
                    });
                    
                    // Also update local state immediately
                    setChats(prev => prev.map(c => 
                      c._id === chat._id 
                        ? { ...c, unreadCount: 0 }
                        : c
                    ));
                  }
                  
                  setSelectedChat(chat);
                }}
                className={`p-3 rounded-2xl cursor-pointer hover:bg-gray-900 transition-all ${
                  selectedChat?._id === chat._id ? 'bg-gray-900 border border-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                      {isGroup ? (
                        <span className="text-2xl">👥</span>
                      ) : (
                        participant?.avatar ? (
                          <img 
                            src={participant.avatar.includes('http') ? participant.avatar : `http://localhost:5000/uploads/${participant.avatar}`}
                            alt={participant.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('❌ Failed to load avatar:', e.target.src);
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-2xl">👤</span>
                        )
                      )}
                    </div>
                    {/* Online status indicator */}
                    {!isGroup && userStatus && (
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                        userStatus.isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium truncate">{chatName}</p>
                      <span className="text-xs text-gray-500 ml-2">{messageTime}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-400 truncate flex-1">
                        {isTyping ? (
                          <span className="text-green-400 italic">typing...</span>
                        ) : (
                          chat.latestMessage?.content || "Start chatting..."
                        )}
                      </p>
                      
                      <div className="flex items-center gap-2 ml-2">
                        {/* Unread count badge */}
                        {chat.unreadCount > 0 && (
                          <div className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </div>
                        )}
                        
                        {/* Status text for non-group chats */}
                        {!isGroup && userStatus && !isTyping && (
                          <span className="text-xs text-gray-500">
                            {userStatus.isOnline ? 'online' : formatLastSeen(userStatus.lastSeen)}
                          </span>
                        )}
                      </div>
                    </div>
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
              {console.log('🎨 RENDERING MESSAGES:', messages.length) || messages.map((msg) => (
                  <div
                    key={msg._id}
                    id={`message-${msg._id}`}
                    className={`flex ${msg.sender._id === currentUser.id ? 'justify-end' : 'justify-start'} group`}
                  >
                  <div className={`max-w-[65%] px-5 py-3 rounded-3xl transition-all ${
                    msg.sender._id === currentUser.id ? 'bg-blue-600 text-white' : 'bg-gray-800'
                  }`}>
                    {/* Display message content */}
                    {msg.content && <p>{msg.content}</p>}
                    
                    {/* Display file attachment */}
                    {msg.file && msg.file.url && msg.file.name && (
                      <div 
                        className="mt-2 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => window.open(`http://localhost:5000${msg.file.url}`, '_blank')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {msg.file.type?.startsWith('image/') ? '🖼️' : 
                             msg.file.type?.startsWith('video/') ? '🎥' : 
                             msg.file.type?.startsWith('audio/') ? '🎵' : 
                             msg.file.type === 'application/pdf' ? '📄' : '📎'}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white truncate">
                              {msg.file.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {(msg.file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        
                        {/* Image preview */}
                        {msg.file.type?.startsWith('image/') && (
                          <div className="mt-2">
                            <img 
                              src={`http://localhost:5000${msg.file.url}`}
                              alt={msg.file.name}
                              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(`http://localhost:5000${msg.file.url}`, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {typingUsers[msg.sender._id] && msg.sender._id !== currentUser.id && (
                      <p className="text-xs mt-1 text-blue-400 animate-pulse">
                        {msg.sender.name} is typing...
                      </p>
                    )}
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
                  {/* Plus button for file attachment */}
                  <label className="p-4 text-2xl text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-full transition-all cursor-pointer" title="Attach file">
                    📎
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,video/*,.pdf,.doc,.doc,.txt"
                    />
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-4 text-2xl text-gray-400 hover:text-yellow-400 hover:bg-gray-700 rounded-full transition-all"
                    title="Add emoji"
                  >
                    😊
                  </button>
                  
                  {/* Show attached file preview */}
                  {attachedFile && (
                    <div className="absolute bottom-16 left-0 bg-gray-800 rounded-lg p-3 border border-gray-700 shadow-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">📎 {attachedFile.name}</span>
                        <button
                          onClick={removeAttachedFile}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="text-xs text-gray-400">
                        Size: {(attachedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  )}
                  
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
