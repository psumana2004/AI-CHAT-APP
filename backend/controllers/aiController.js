exports.askAI = async (req, res) => {
  try {
    const { message } = req.body;

    const text = message.toLowerCase();

    let reply = "Interesting... tell me more!";

    if (text.includes("hello") || text.includes("hi")) {
      reply = "Hey there! 👋";
    } else if (text.includes("how are you")) {
      reply = "I'm doing great! How about you?";
    } else if (text.includes("bye")) {
      reply = "Goodbye! Talk to you soon 😊";
    } else if (text.includes("project")) {
      reply = "Your project sounds awesome 🚀";
    } else if (text.includes("help")) {
      reply = "Sure! I'm here to help 💡";
    }

    // simulate AI delay (VERY IMPORTANT for realism)
    setTimeout(() => {
      res.json({ reply });
    }, 800);

  } catch (error) {
    res.status(500).json({ message: "AI failed" });
  }
};