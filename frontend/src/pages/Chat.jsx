import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import GroupModal from "../components/GroupModal";
import CreateChatModal from "../components/CreateChatModal";

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

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const messagesEndRef = useRef(null);

  // Socket Connection
  useEffect(() => {
    socket = io('http://localhost:5000');

    socket.emit('joinUser', currentUser.id);

    socket.on('receiveMessage', (newMsg) => {
      console.log('📨 REAL-TIME MESSAGE RECEIVED:', newMsg);

      // Add message if we are currently viewing that chat
      if (selectedChat && newMsg.chat === selectedChat._id) {
        setMessages(prev => [...prev, newMsg]);
      }

      // Refresh chats list for latest message preview
      fetchChats();
    });

    socket.on('userTyping', ({ chatId, userId, isTyping }) => {
      if (selectedChat && chatId === selectedChat._id) {
        setTypingUsers(prev => ({ ...prev, [userId]: isTyping }));
      }
    });

    return () => socket.disconnect();
  }, [selectedChat]);   // Important: re-attach when chat changes

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

  useEffect(() => {
    fetchChats();
  }, []);

  // When user selects a chat → join room + load messages
  useEffect(() => {
    if (selectedChat) {
      socket.emit('joinChat', selectedChat._id);
      fetchMessages(selectedChat._id);
    }
  }, [selectedChat]);

  // Auto scroll
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

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

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (selectedChat) {
      socket.emit('typing', { 
        chatId: selectedChat._id, 
        userId: currentUser.id, 
        isTyping: true 
      });
    }
  };

  const stopTyping = () => {
    if (selectedChat) {
      socket.emit('typing', { 
        chatId: selectedChat._id, 
        userId: currentUser.id, 
        isTyping: false 
      });
    }
  };

  return (
    <div className="h-screen flex bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      
      <div className="w-80 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 bg-gray-900">
          <h1 className="text-2xl font-bold mb-3">Chats</h1>
          <div >
          <button
            onClick={() => setShowNewChat(true)}
            className="w-full bg-blue-600 py-2 rounded-xl mb-3">
            + New Chat
          </button>
          <button
            onClick={() => setShowGroupModal(true)}
            className="w-full bg-green-600 py-2 rounded-xl mb-2">
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
                  <div className="w-11 h-11 bg-gray-700 rounded-full flex items-center justify-center text-2xl">👤</div>
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

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-2xl">👤</div>
              <h2 className="font-semibold">
                {selectedChat.participants?.find(p => p._id !== currentUser.id)?.name}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-950">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.sender._id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[65%] px-5 py-3 rounded-3xl ${
                    msg.sender._id === currentUser.id ? 'bg-blue-600 text-white' : 'bg-gray-800'
                  }`}>
                    <p>{msg.content}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {Object.values(typingUsers).some(Boolean) && (
              <div className="px-6 pb-3 text-sm text-gray-400">Typing...</div>
            )}

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 bg-gray-900">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onBlur={stopTyping}
                  onKeyUp={stopTyping}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-6 py-4 focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-10 rounded-full font-medium transition">
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

      {/* New Chat Modal */}
      {showNewChat && (
        
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-2xl w-96">
            <h3 className="text-xl font-bold mb-4">New Chat</h3>
            <input
              type="text"
              placeholder="Paste other user's ID"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 rounded-xl mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNewChat(false)} className="flex-1 py-3 bg-gray-800 rounded-xl">Cancel</button>
              <button onClick={createNewChat} className="flex-1 py-3 bg-blue-600 rounded-xl">Start Chat</button>
            </div>
          </div>
        </div>
      )}
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
    </div>
    
  );
  

};

export default Chat;