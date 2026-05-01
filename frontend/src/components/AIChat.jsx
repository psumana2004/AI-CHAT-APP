import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AIChat = ({ onClose, currentUser }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      content: "Hello! I'm your AI assistant. I can help you with various tasks like answering questions, providing suggestions, or just having a conversation. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Demo questions and smart replies
  const demoQuestions = [
    "Hi",
    "What does css mean?",
    "Define html",
    "Meaning of python",
    "What is react?",
    "Explain api",
    "Define security",
    "What does git mean?",
    "Meaning of docker",
    "What is aws?",
    "Define kubernetes",
    "What does jwt mean?",
    "Meaning of cors",
    "What is ssl?",
    "Define frontend",
    "What does backend mean?",
    "Meaning of database",
    "What is node?",
    "Define algorithm",
    "What does async mean?",
    "Meaning of promise",
    "What is closure?",
    "Define variable",
    "What does array mean?",
    "Meaning of object",
    "What is string?",
    "Define function",
    "What does class mean?",
    "Meaning of module",
    "What is import?",
    "Define export",
    "What does component mean?",
    "Meaning of state",
    "What is props?",
    "Define hooks",
    "What does router mean?",
    "Meaning of token",
    "What is session?",
    "Define cookie",
    "What does error mean?",
    "Meaning of debug",
    "What is testing?",
    "Define deployment",
    "What does production mean?",
    "Meaning of localhost",
    "What is port?",
    "Define domain",
    "What does hosting mean?",
    "Meaning of server",
    "What is client?",
    "Define framework",
    "What does library mean?",
    "Meaning of package",
    "What is middleware?",
    "Define encryption",
    "What does firewall mean?",
    "Meaning of vpn",
    "What is authentication?",
    "Define authorization",
    "What does mfa mean?",
    "Meaning of sso",
    "What is graphql?",
    "Define rest",
    "What does json mean?",
    "Meaning of xml",
    "What is ajax?",
    "Define callback",
    "What does hoisting mean?",
    "Meaning of prototype",
    "What is boolean?",
    "Define null",
    "What does undefined mean?",
    "Meaning of bug",
    "What is fullstack?",
    "Define cloud",
    "What does blockchain mean?",
    "Meaning of quantum",
    "What is machine learning?",
    "Define cybersecurity",
    "What does mysql mean?",
    "Meaning of mongodb",
    "What is azure?",
    "Define vscode",
    "What does github mean?",
    "Meaning of promise"
  ];

  const smartReplies = [
    "What does css mean?",
    "Define html",
    "Meaning of python",
    "What is react?",
    "Explain api",
    "Define security",
    "What does git mean?",
    "Meaning of docker",
    "What is aws?",
    "Define kubernetes",
    "What does jwt mean?",
    "Meaning of cors",
    "What is ssl?",
    "Define frontend",
    "What does backend mean?",
    "Meaning of database",
    "What is node?",
    "Define algorithm",
    "What does async mean?",
    "Meaning of promise",
    "What is closure?",
    "Define variable",
    "What does array mean?",
    "Meaning of object",
    "What is string?",
    "Define function",
    "What does class mean?",
    "Meaning of module",
    "What is import?",
    "Define export",
    "What does component mean?",
    "Meaning of state",
    "What is props?",
    "Define hooks",
    "What does router mean?",
    "Meaning of token",
    "What is session?",
    "Define cookie",
    "What does error mean?",
    "Meaning of debug",
    "What is testing?",
    "Define deployment",
    "What does production mean?",
    "Meaning of localhost",
    "What is port?",
    "Define domain",
    "What does hosting mean?",
    "Meaning of server",
    "What is client?",
    "Define framework",
    "What does library mean?",
    "Meaning of package",
    "What is middleware?",
    "Define encryption",
    "What does firewall mean?",
    "Meaning of vpn",
    "What is authentication?",
    "Define authorization",
    "What does mfa mean?",
    "Meaning of sso",
    "What is graphql?",
    "Define rest",
    "What does json mean?",
    "Meaning of xml",
    "What is ajax?",
    "Define callback",
    "What does hoisting mean?",
    "Meaning of prototype",
    "What is boolean?",
    "Define null",
    "What does undefined mean?",
    "Meaning of bug",
    "What is fullstack?",
    "Define cloud",
    "What does blockchain mean?",
    "Meaning of quantum",
    "What is machine learning?",
    "Define cybersecurity",
    "What does mysql mean?",
    "Meaning of mongodb",
    "What is azure?",
    "Define vscode",
    "What does github mean?",
    "Meaning of promise"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateAIResponse = async (userMessage) => {
    const message = userMessage.toLowerCase().trim();
    
    // Simple demo-based responses
    if (message.match(/^(hi|hello|hey|good morning|good afternoon|good evening)$/)) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return `${userMessage}! How can I help you today?`;
    }
    
    if (message.match(/^(how are you|how are you doing|what's up)$/)) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return "I'm doing great! Ready to help with any questions you have.";
    }
    
    // Simple dictionary responses
    if (message.match(/(what does|define|meaning of|what is the meaning of)/)) {
      const wordMatch = message.match(/(\w+)$/i);
      if (wordMatch) {
        const word = wordMatch[1];
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const dictionary = {
          'serendipity': 'finding good things by chance',
          'hello': 'a greeting used to say hi',
          'love': 'strong feeling of affection',
          'happy': 'feeling good and pleased',
          'computer': 'electronic device for processing data',
          'artificial': 'made by humans, not natural',
          'intelligence': 'ability to learn and think',
          'learning': 'getting new knowledge',
          'react': 'a tool for building user interfaces',
          'javascript': 'programming language for websites',
          'node': 'javascript that runs on servers',
          'database': 'place to store data',
          'algorithm': 'step-by-step instructions',
          'programming': 'writing code for computers',
          'frontend': 'user-facing part of website',
          'backend': 'server-side of website',
          'api': 'way for programs to talk',
          'security': 'protecting computer systems',
          'cloud': 'internet-based computing',
          'blockchain': 'secure digital ledger',
          'quantum': 'advanced computing technology',
          'machine learning': 'computers learning from data',
          'cybersecurity': 'protecting from digital threats',
          'css': 'styling language for websites',
          'html': 'structure language for web pages',
          'python': 'popular programming language',
          'java': 'object-oriented programming language',
          'mysql': 'popular database system',
          'mongodb': 'nosql database system',
          'aws': 'amazon cloud services',
          'azure': 'microsoft cloud platform',
          'docker': 'container technology',
          'kubernetes': 'container orchestration',
          'git': 'version control system',
          'github': 'code hosting platform',
          'vscode': 'popular code editor',
          'api': 'application programming interface',
          'rest': 'api architecture style',
          'graphql': 'query language for apis',
          'authentication': 'user login system',
          'authorization': 'permission system',
          'encryption': 'data protection method',
          'firewall': 'network security system',
          'vpn': 'virtual private network',
          'ssl': 'secure connection protocol',
          'https': 'secure web protocol',
          'http': 'web communication protocol',
          'json': 'data format',
          'xml': 'markup language',
          'ajax': 'asynchronous web requests',
          'promise': 'javascript async pattern',
          'async': 'non-blocking operations',
          'await': 'javascript keyword',
          'callback': 'function parameter',
          'closure': 'javascript concept',
          'hoisting': 'javascript behavior',
          'prototype': 'javascript object pattern',
          'class': 'object template',
          'function': 'code block unit',
          'variable': 'data container',
          'array': 'ordered data list',
          'object': 'key-value structure',
          'string': 'text data',
          'number': 'numeric data',
          'boolean': 'true/false data',
          'null': 'empty value',
          'undefined': 'missing value',
          'error': 'program failure',
          'bug': 'code mistake',
          'debug': 'finding errors',
          'testing': 'code verification',
          'deployment': 'code release',
          'production': 'live environment',
          'development': 'coding environment',
          'localhost': 'local server',
          'port': 'network endpoint',
          'domain': 'website address',
          'hosting': 'website service',
          'server': 'computer program',
          'client': 'user program',
          'frontend': 'user interface',
          'backend': 'server logic',
          'fullstack': 'both frontend and backend',
          'middleware': 'between layers',
          'framework': 'code library',
          'library': 'reusable code',
          'package': 'code bundle',
          'module': 'code file',
          'import': 'using code',
          'export': 'sharing code',
          'component': 'ui element',
          'state': 'data memory',
          'props': 'component data',
          'hooks': 'react feature',
          'redux': 'state management',
          'router': 'navigation system',
          'authentication': 'user verification',
          'session': 'user tracking',
          'cookie': 'browser storage',
          'token': 'access key',
          'jwt': 'token format',
          'oauth': 'login method',
          'sso': 'single login',
          'mfa': 'multi-factor auth',
          'cors': 'sharing policy',
          'cors': 'cross-origin requests'
        };
        
        const definition = dictionary[word.toLowerCase()];
        if (definition) {
          return `**${word}**: ${definition}`;
        } else {
          return `I don't know "${word}". Available words: css, html, python, java, mysql, mongodb, aws, azure, docker, kubernetes, git, github, vscode, api, rest, graphql, authentication, authorization, encryption, firewall, vpn, ssl, https, http, json, xml, ajax, promise, async, await, callback, closure, hoisting, prototype, class, function, variable, array, object, string, number, boolean, null, undefined, error, bug, debug, testing, deployment, production, development, localhost, port, domain, hosting, server, client, frontend, backend, fullstack, middleware, framework, library, package, module, import, export, component, state, props, hooks, redux, router, session, cookie, token, jwt, oauth, sso, mfa, cors`;
        }
      }
    }
    
    // Simple explanations
    if (message.match(/(explain|tell me about|what is)/)) {
      const topicMatch = message.match(/(?:about\s+)?(\w+)$/i);
      if (topicMatch) {
        const topic = topicMatch[1];
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const explanations = {
          'ai': 'computers that can think and learn',
          'react': 'a tool for building websites',
          'javascript': 'programming language for web',
          'node': 'javascript that runs on servers',
          'database': 'place to store data'
        };
        
        const explanation = explanations[topic.toLowerCase()];
        if (explanation) {
          return `**${topic}**: ${explanation}`;
        } else {
          return `I can explain: ai, react, javascript, node, database`;
        }
      }
    }
    
    // Simple math
    if (message.match(/(\d+[\+\-\*\/]\d+)/)) {
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        const result = eval(message.match(/(\d+[\+\-\*\/]\d+)/)[1]);
        return `${message.match(/(\d+[\+\-\*\/]\d+)/)[1]} = ${result}`;
      } catch {
        return "I can do simple math like 2+2 or 10*5";
      }
    }
    
    // Time and date
    if (message.match(/(what time is it|current time|what's the date)/)) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const now = new Date();
      return `It's ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}`;
    }
    
    // Simple help
    if (message.match(/^(help|what can you do)/)) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return `I can help you with:
• Dictionary: define words
• Explanations: explain topics  
• Math: calculate numbers
• Time: tell current time
Try asking: "what does hello mean?" or "explain ai"`;
    }
    
    // Default response
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "That's interesting! I'm still learning and can help with basic questions.";
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Generate AI response
      const aiResponse = await generateAIResponse(messageText);
      
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Response Error:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuestionClick = (question) => {
    handleSendMessage(question);
  };

  const handleSmartReplyClick = (reply) => {
    handleSendMessage(reply);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-950 w-full max-w-2xl h-[80vh] max-h-[800px] rounded-2xl shadow-2xl flex flex-col border border-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                🤖
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Assistant</h3>
                <p className="text-xs text-white/80">Always here to help</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                message.sender === 'user' 
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                  : 'bg-gray-800 text-gray-100'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-800 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Demo Questions */}
        <div className="px-4 py-3 border-t border-gray-800">
          <p className="text-xs text-gray-400 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {demoQuestions.slice(0, 3).map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuestionClick(question)}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-full transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Smart Replies */}
        <div className="px-4 py-3 border-t border-gray-800">
          <p className="text-xs text-gray-400 mb-2">Quick replies:</p>
          <div className="flex flex-wrap gap-2">
            {smartReplies.slice(0, 3).map((reply, index) => (
              <button
                key={index}
                onClick={() => handleSmartReplyClick(reply)}
                className="text-xs bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-purple-300 border border-purple-500/30 px-3 py-2 rounded-full transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-full transition-all text-sm font-medium"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
