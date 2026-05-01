import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const StarredMessages = () => {
  const [starredMessages, setStarredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchStarredMessages();
  }, []);

  const fetchStarredMessages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/messages/starred', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStarredMessages(response.data);
    } catch (error) {
      console.error('Error fetching starred messages:', error);
      toast.error('Failed to fetch starred messages');
    } finally {
      setLoading(false);
    }
  };

  const toggleStarMessage = async (messageId) => {
    try {
      await axios.patch(`http://localhost:5000/api/messages/${messageId}/star`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove the message from the list since it's no longer starred
      setStarredMessages(prev => prev.filter(msg => msg._id !== messageId));
      toast.success('Message unstarred');
    } catch (error) {
      console.error('Error toggling star:', error);
      toast.error('Failed to unstar message');
    }
  };

  const getChatName = (message) => {
    if (message.chat.isGroupChat) {
      return message.chat.chatName || 'Group Chat';
    } else {
      const otherParticipant = message.chat.participants?.find(p => p._id !== message.sender._id);
      return otherParticipant?.name || 'Unknown User';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const openChat = (chatId, messageId) => {
    navigate(`/chat?chatId=${chatId}&messageId=${messageId}`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-lg">Loading starred messages...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            ⭐ Starred Messages
          </h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {starredMessages.length} {starredMessages.length === 1 ? 'message' : 'messages'}
        </p>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        {starredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-6xl mb-4">⭐</div>
            <p className="text-lg mb-2">No starred messages yet</p>
            <p className="text-sm">Star messages to find them here quickly</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {starredMessages.map((message) => (
              <div
                key={message._id}
                className="p-4 hover:bg-gray-900 transition-colors cursor-pointer"
                onClick={() => openChat(message.chat._id, message._id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm">
                      {message.sender.avatar ? (
                        <img
                          src={message.sender.avatar.includes('http') ? message.sender.avatar : `http://localhost:5000/uploads/${message.sender.avatar}`}
                          alt={message.sender.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{message.sender.name}</p>
                      <p className="text-sm text-gray-400">{getChatName(message)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formatDate(message.createdAt)} at {formatTime(message.createdAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStarMessage(message._id);
                      }}
                      className="text-yellow-500 hover:text-yellow-400 transition-colors"
                      title="Unstar message"
                    >
                      ⭐
                    </button>
                  </div>
                </div>
                <div className="ml-13">
                  <p className="text-gray-300 bg-gray-800 p-3 rounded-lg">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StarredMessages;
