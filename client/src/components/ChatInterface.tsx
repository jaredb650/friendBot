import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatInterface.css';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate welcome message using current character prompt
  const generateWelcomeMessage = async () => {
    if (hasInitialized) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post('/api/chat/message', {
        message: "Hello! Please introduce yourself to me.",
        conversationId: null
      });

      const welcomeMessage: Message = {
        id: '1',
        text: response.data.response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages([welcomeMessage]);
      setConversationId(response.data.conversationId);
      setHasInitialized(true);
    } catch (error) {
      // Fallback to default message if API fails
      const fallbackMessage: Message = {
        id: '1',
        text: "Hey there! I'm having some technical difficulties, but I'm excited to chat with you! What's on your mind?",
        isUser: false,
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
      setHasInitialized(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    generateWelcomeMessage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to start a new chat
  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setHasInitialized(false);
    generateWelcomeMessage();
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat/message', {
        message: inputMessage,
        conversationId
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setConversationId(response.data.conversationId);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Oops bestie! Something went wrong! 😅 Maybe you should try our Premium Error-Free Service for just $9.99! But seriously, please try again!",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>🤖 FriendBot - Your Best Friend Forever! 💕</h1>
        <p className="subtitle">The friend who TOTALLY cares about you (and wants to sell you stuff)!</p>
        <div className="header-controls">
          <button onClick={startNewChat} className="new-chat-button">
            🔄 New Chat
          </button>
          <a href="/admin/login" className="admin-link">Admin Panel</a>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-content">
              <p>{message.text}</p>
              <span className="timestamp">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message">
            <div className="message-content">
              <p className="typing-indicator">FriendBot is typing... 💭</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Tell your bestie what's on your mind! (So they can recommend products!)"
          className="message-input"
          rows={2}
        />
        <button 
          onClick={sendMessage} 
          disabled={isLoading || !inputMessage.trim()}
          className="send-button"
        >
          Send 💌
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;