const axios = require('axios');

exports.askAI = async (req, res) => {
  try {
    const { message } = req.body;
    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

    console.log('🔑 Hugging Face API Key:', HUGGINGFACE_API_KEY ? 'Present' : 'Missing');
    console.log('🔧 Environment Variables:', Object.keys(process.env).filter(key => key.includes('HUGGING')));

    if (!HUGGINGFACE_API_KEY) {
      console.log('❌ Hugging Face API key not found in environment variables');
      return res.status(500).json({ message: "Hugging Face API key not configured" });
    }

    console.log('✅ Hugging Face API key found, making API call...');

    // Use a conversational model from Hugging Face
    console.log('🤖 Making Hugging Face API call with message:', message);
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        inputs: message,
        parameters: {
          max_length: 100,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9,
          return_full_text: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Hugging Face API response status:', response.status);
    console.log('📨 Hugging Face API response data:', response.data);

    // Extract the generated text from Hugging Face response
    let reply = "I'm sorry, I couldn't generate a response.";
    
    console.log('🔍 Processing Hugging Face response...');
    console.log('📊 Response data structure:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.length > 0) {
      const generatedText = response.data[0].generated_text;
      console.log('📝 Generated text:', generatedText);
      
      if (generatedText && generatedText.trim()) {
        reply = generatedText.trim();
        console.log('✅ Using generated reply:', reply);
      } else {
        console.log('❌ Generated text is empty or invalid');
      }
    } else {
      console.log('❌ No response data or empty array');
    }

    // Fallback to simple responses if Hugging Face fails
    if (reply === "I'm sorry, I couldn't generate a response.") {
      const text = message.toLowerCase();
      
      if (text.includes("hello") || text.includes("hi")) {
        reply = "Hey there! 👋";
      } else if (text.includes("how are you")) {
        reply = "I'm doing great! How about you?";
      } else if (text.includes("bye")) {
        reply = "Goodbye! Talk to you soon 😊";
      } else if (text.includes("help")) {
        reply = "Sure! I'm here to help 💡";
      } else {
        reply = "That's interesting! Tell me more about it.";
      }
    }

    res.json({ reply });

  } catch (error) {
    console.error('Hugging Face API Error:', error);
    
    // Fallback response if API fails
    const text = req.body.message.toLowerCase();
    let fallbackReply = "I'm having trouble connecting right now. Could you try again?";
    
    if (text.includes("hello") || text.includes("hi")) {
      fallbackReply = "Hey there! �";
    } else if (text.includes("how are you")) {
      fallbackReply = "I'm doing great! How about you?";
    } else if (text.includes("help")) {
      fallbackReply = "Sure! I'm here to help 💡";
    }
    
    res.json({ reply: fallbackReply });
  }
};