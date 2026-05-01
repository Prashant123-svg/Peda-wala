/**
 * 🤖 Floating Chatbot Widget Component
 * Mobile-responsive, beautiful, and feature-rich
 */

import React, { useState, useRef, useEffect } from 'react';
import { AiOutlineSend, AiOutlineClose, AiOutlineRobot } from 'react-icons/ai';
import { BiChat, BiHelpCircle } from 'react-icons/bi';
import { MdOutlineExpandMore } from 'react-icons/md';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatbotWidgetProps {
  apiBaseUrl?: string;
  position?: 'bottom-right' | 'bottom-left';
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  apiBaseUrl = 'http://localhost:5000',
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: '🙏 Namaste! Pedhe Wala me welcome! Aap product price, flavours, order tracking ya offers puch sakte hain.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickButtons, setShowQuickButtons] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowQuickButtons(false);

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputValue,
          userId: localStorage.getItem('userId') || 'guest',
          conversationId: localStorage.getItem('conversationId') || null
        })
      });

      if (!response.ok) throw new Error('Network response failed');

      const { parseResponse } = await import("../utils/fetchUtils");
      const data = (await parseResponse(response)) || {};

      // Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: data.reply || 'Sorry! कुछ error हो गया। 😔',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry! Connection error। कृपया बाद में try करें। 😔',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickButton = (text: string) => {
    setInputValue(text);
  };

  const handleSupportEscalation = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/chat/support-escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: localStorage.getItem('userId') || 'guest',
          message: 'User wants to escalate to support'
        })
      });

      const { parseResponse } = await import("../utils/fetchUtils");
      const data = (await parseResponse(response)) || {};

      const escalationMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `${data.message || data.raw || 'Support contacted'}` + (data.contactOptions ? `\n\n📱 WhatsApp: ${data.contactOptions.whatsapp}\n📞 Call: ${data.contactOptions.phone}` : ''),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, escalationMessage]);
    } catch (error) {
      console.error('Escalation error:', error);
    }
  };

  const positionClass = position === 'bottom-right'
    ? 'bottom-4 right-4'
    : 'bottom-4 left-4';

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClass} z-40 bg-gradient-to-br from-yellow-400 to-orange-500 hover:shadow-2xl transition-all duration-300 transform hover:scale-110 rounded-full p-4 shadow-lg text-white`}
          aria-label="Open Chatbot"
        >
          <BiChat size={28} />
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
            1
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed ${positionClass} z-50 w-full sm:w-96 h-screen sm:h-[600px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2">
              <AiOutlineRobot size={24} />
              <div>
                <h3 className="font-bold text-lg">PedheWalaBot</h3>
                <p className="text-xs opacity-90">Always here to help 🙏</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition"
            >
              <AiOutlineClose size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-2xl break-words ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="text-sm sm:text-base whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <span className={`text-xs mt-1 block ${
                    message.type === 'user' ? 'text-gray-700 opacity-70' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-none">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Buttons */}
          {showQuickButtons && messages.length <= 1 && (
            <div className="bg-white border-t border-gray-200 p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Quick Options:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickButton('Product price')}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-semibold py-2 px-3 rounded-lg transition"
                >
                  💰 Price
                </button>
                <button
                  onClick={() => handleQuickButton('Order tracking')}
                  className="bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-semibold py-2 px-3 rounded-lg transition"
                >
                  📦 Track Order
                </button>
                <button
                  onClick={() => handleQuickButton('Delivery info')}
                  className="bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold py-2 px-3 rounded-lg transition"
                >
                  🚚 Delivery
                </button>
                <button
                  onClick={() => handleQuickButton('Help')}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold py-2 px-3 rounded-lg transition"
                >
                  ❓ Help
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Enter your question... (Hindi/English/Hinglish)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:shadow-lg disabled:opacity-50 text-white rounded-full p-2 transition transform hover:scale-105"
              >
                <AiOutlineSend size={20} />
              </button>
            </div>

            <button
              onClick={handleSupportEscalation}
              className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <BiHelpCircle size={16} />
              Need Human Support? WhatsApp or Call 📞
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
