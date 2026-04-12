import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const GroupModal = ({ show, setShow, token, fetchChats }) => {
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState("");

  const handleCreateGroup = async () => {
    if (!groupName || !users) {
      return toast.error("Fill all fields");
    }

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/chat/group",
        {
          name: groupName,
          users: users.split(",").map(u => u.trim())
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success("Group created!");
      setShow(false);
      setGroupName("");
      setUsers("");
      fetchChats();

    } catch (err) {
      toast.error("Failed to create group");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
      <div className="bg-gray-900 p-6 rounded-xl w-96">
        <h2 className="text-xl mb-4">Create Group</h2>

        <input
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full mb-3 p-3 bg-gray-800 rounded"
        />

        <input
          placeholder="User IDs (comma separated)"
          value={users}
          onChange={(e) => setUsers(e.target.value)}
          className="w-full mb-4 p-3 bg-gray-800 rounded"
        />

        <div className="flex gap-2">
          <button onClick={() => setShow(false)} className="flex-1 bg-gray-700 p-2 rounded">
            Cancel
          </button>
          <button onClick={handleCreateGroup} className="flex-1 bg-blue-600 p-2 rounded">
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;