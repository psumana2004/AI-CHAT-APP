import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const CreateChatModal = ({ show, setShow, token, setSelectedChat, fetchChats }) => {
  const [userId, setUserId] = useState("");

  const handleCreateChat = async () => {
    if (!userId) return toast.error("Enter User ID");

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/chat",
        { userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Chat created!");
      setShow(false);
      setUserId("");
      fetchChats();
      setSelectedChat(data);

    } catch {
      toast.error("Failed to create chat");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-2xl w-96">
        <h2 className="text-xl font-bold mb-4">New Chat</h2>

        <input
          type="text"
          placeholder="Enter User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 rounded-xl mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={() => setShow(false)}
            className="flex-1 py-3 bg-gray-800 rounded-xl"
          >
            Cancel
          </button>

          <button
            onClick={handleCreateChat}
            className="flex-1 py-3 bg-blue-600 rounded-xl"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateChatModal;