import { useState, useEffect } from "react";
import { FaPaperPlane, FaRobot, FaUser, FaTimes, FaChevronDown, FaMicrophone } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { BounceLoader } from "react-spinners";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI("AIzaSyBBOjSwwb4XtDk_z5HeN8L2_zruaJacSUk");

export default function FoodWasteChatbot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Scroll to bottom when messages update
  useEffect(() => {
    const container = document.getElementById("message-container");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Function to simulate typing effect
  const simulateTyping = async (text, callback) => {
    setIsTyping(true);
    let currentText = "";
    const words = text.split(" ");
    
    for (let word of words) {
      currentText += word + " ";
      callback(currentText);
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
    }
    setIsTyping(false);
  };

  // Function to handle voice input
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser');
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };

    recognition.start();
  };

  // Function to send a message
  const sendMessage = async () => {
    if (!question.trim()) return;

    const newMessages = [...messages, { text: question, sender: "user" }];
    setMessages(newMessages);
    setQuestion("");
    setLoading(true);
    setHasError(false);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are an AI expert in food waste reduction and redistribution. Answer the following question:\n\n"${question}"`;

      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();

      // Add temporary message for typing effect
      const tempMessage = { text: "", sender: "bot", isTyping: true };
      setMessages([...newMessages, tempMessage]);

      // Simulate typing effect
      await simulateTyping(aiResponse, (text) => {
        setMessages(prevMessages => {
          const newMsgs = [...prevMessages];
          newMsgs[newMsgs.length - 1] = { text, sender: "bot" };
          return newMsgs;
        });
      });

    } catch (error) {
      console.error("Error:", error);
      setHasError(true);
      setMessages([
        ...newMessages,
        {
          text: "I couldn't connect to the AI service. Please check your internet and try again.",
          sender: "bot",
        },
      ]);
    }

    setLoading(false);
  };

  // Handle enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Retry connection on error
  const retryConnection = () => {
    if (hasError) {
      setHasError(false);
      sendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="fixed bottom-4 right-4 w-96"
    >
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Chatbot Header */}
        <motion.div 
          className="bg-green-600 p-4"
        >
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <motion.div
                animate={{ rotate: isOpen ? 0 : 360 }}
                transition={{ duration: 0.5 }}
              >
                <FaRobot className="text-2xl" />
              </motion.div>
              Food Waste AI Assistant
            </h2>
            <motion.div
              animate={{ rotate: isOpen ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <FaChevronDown className="text-white text-xl" />
            </motion.div>
          </div>
        </motion.div>

        {/* Chat Window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div 
                id="message-container"
                className="h-96 overflow-y-auto p-4 bg-gray-50"
              >
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", damping: 25 }}
                      className={`flex items-start gap-2 mb-4 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
                    >
                      {/* User and Bot Icons */}
                      <motion.div 
                        className={`p-2 rounded-full ${msg.sender === "user" ? "bg-green-500" : "bg-gray-300"}`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {msg.sender === "user" ? <FaUser className="text-white" /> : <FaRobot className="text-gray-700" />}
                      </motion.div>

                      {/* Message Content */}
                      <motion.div 
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.sender === "user" 
                            ? "bg-green-500 text-white rounded-tr-none" 
                            : "bg-gray-200 rounded-tl-none"
                        }`}
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 20 }}
                      >
                        {msg.text}
                        {msg.isTyping && (
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            |
                          </motion.span>
                        )}
                        {hasError && msg.sender === "bot" && (
                          <motion.button 
                            onClick={retryConnection}
                            className="mt-2 text-green-600 underline text-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Retry
                          </motion.button>
                        )}
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Loading Indicator */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-gray-500"
                  >
                    <BounceLoader size={20} color="#22C55E" />
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Thinking...
                    </motion.span>
                  </motion.div>
                )}
              </div>

              {/* Input Box */}
              <motion.div 
                className="p-4 border-t"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex gap-2">
                  <motion.input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about food redistribution..."
                    className="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={loading}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVoiceInput}
                    className={`p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white ${
                      isListening ? 'animate-pulse' : ''
                    }`}
                  >
                    <FaMicrophone />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendMessage}
                    className={`p-3 rounded-full transition-colors ${
                      loading 
                        ? "bg-gray-400 cursor-not-allowed" 
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                    disabled={loading}
                  >
                    <FaPaperPlane />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
