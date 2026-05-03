import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

const SettingsMenu = ({ 
  user, 
  currentChatId, 
  onDeleteCurrentChat = () => {}, 
  onProfileUpdate = () => {}, 
  onToggleTheme = () => {},
  onMarkAllAsRead = () => {}
}) => {
  
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/login");
    setOpen(false);
  };

  const handleDeleteChat = () => {
    if (!currentChatId) {
      toast.error("No chat selected");
      return;
    }
    if (window.confirm("Delete this chat permanently?")) {
      onDeleteCurrentChat(currentChatId);
      setOpen(false);
    }
  };

  const handleMarkAllAsRead = () => {
    if (window.confirm("Mark all messages as read?")) {
      onMarkAllAsRead();
      setOpen(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("name", name);
    if (avatar) {
      formData.append("avatar", avatar);
    }

    try {
      console.log('📤 Sending profile update request:', { name, hasAvatar: !!avatar });
      const { data } = await axios.put(
        "http://localhost:5000/api/users/profile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log('✅ Profile update response:', data);
      console.log('👤 Updated user data:', data.user);

      toast.success("Profile updated!");
      onProfileUpdate(data.user);
      setShowEditModal(false);
      setAvatar(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setName(user?.name || "");
    setAvatar(null);
    setShowEditModal(true);
    setOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="text-3xl text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-all"
        >
          ⋮
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl py-2 z-50">
            <div className="px-4 py-3 border-b border-gray-700">
              <p className="text-xs text-gray-400">Signed in as</p>
              <p className="font-medium text-white">{user?.name || "User"}</p>
            </div>

            <button
              onClick={openEditModal}
              className="w-full text-left px-4 py-3 hover:bg-gray-800 flex items-center gap-3"
            >
              👤 Edit Profile
            </button>

            <button
              onClick={() => navigate('/starred-messages')}
              className="w-full text-left px-4 py-3 hover:bg-gray-800 flex items-center gap-3"
            >
              ⭐ Starred Messages
            </button>

            <button
              onClick={onToggleTheme}
              className="w-full text-left px-4 py-3 hover:bg-gray-800 flex items-center gap-3"
            >
              🎨 Change Theme
              <span className="text-xs text-gray-500 ml-auto">
                {localStorage.getItem('theme') === 'dark' ? '🌙 Dark' : 
                 localStorage.getItem('theme') === 'light' ? '☀️ Light' : '🌊 Ocean'}
              </span>
            </button>

            <button
              onClick={handleMarkAllAsRead}
              className="w-full text-left px-4 py-3 hover:bg-gray-800 flex items-center gap-3"
            >
              ✅ Mark All as Read
            </button>

            <div className="border-t border-gray-700 my-1" />

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 hover:bg-gray-800 text-red-400 flex items-center gap-3"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
          <div className="bg-gray-900 p-8 rounded-3xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Current Avatar Display */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mb-4 overflow-hidden">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="Current avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profile Picture
                </label>
                <input
                  type="file"
                  onChange={(e) => setAvatar(e.target.files[0])}
                  accept="image/*"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                {avatar && (
                  <p className="text-sm text-gray-400 mt-2">
                    Selected: {avatar.name}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsMenu;