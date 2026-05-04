import { useState } from "react";
import axios from "axios";

const AIPage = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const token = localStorage.getItem("token");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "You", text: input };
    setMessages(prev => [...prev, userMsg]);

    const { data } = await axios.post(
      "http://localhost:5000/api/ai/ask",
      { message: input },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const aiMsg = { sender: "AI", text: data.reply };
    setMessages(prev => [...prev, aiMsg]);

    setInput("");
  };

  return (
    <div className="h-screen flex flex-col p-6 bg-gray-950 text-white">
      <h1 className="text-2xl mb-4">AI Chat 🤖</h1>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.sender}:</b> {m.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-3 bg-gray-800 rounded"
        />
        <button onClick={sendMessage} className="bg-blue-600 px-4 rounded">
          Send
        </button>
      </div>
    </div>
  );
};

export default AIPage;