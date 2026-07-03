import { useState, useEffect, useRef } from 'react';
import { EMMA_API } from "../config/emmaConfig";
import { Send, X, Minimize2, Maximize2, Mic, MicOff, Loader2 } from 'lucide-react';

/**
 * EmmaChat - Conversational AI Assistant Component
 * Integrates with Emma backend API for intelligent conversations
 */
const EmmaChat = ({ isOpen, onClose, onMinimize, isMinimized }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Initialize session on mount
  useEffect(() => {
    if (isOpen && !sessionId) {
      initializeSession();
    }
  }, [isOpen]);

  // Initialize new conversation session
  const initializeSession = async () => {
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'ashraf' })
      });
      const data = await response.json();
      const nextSessionId = data.session?.id || data.id || null;
      setSessionId(nextSessionId);
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: "Hello! I'm Emma, your Executive Meta Mind Advisor. I'm here to help with project updates, financial analysis, market insights, and strategic planning. How can I assist you today?",
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setMessages([{
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    }
  };

  // Send message to Emma
  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(EMMA_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId
        })
      });

      const data = await response.json();

      if (data.reply) {
        const assistantMessage = {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toISOString(),
          usedFallback: data.usedFallback,
          actions: data.actions
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Handle session resume action
        if (data.resumedSession) {
          setSessionId(data.resumedSession);
        }
      } else {
        throw new Error('No reply from Emma');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize, but I encountered an error processing your message. Please try again.",
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Handle voice input toggle
  const toggleVoice = () => {
    setIsVoiceActive(!isVoiceActive);
    // Voice integration will be added later
    if (!isVoiceActive) {
      console.log('Voice input activated');
    } else {
      console.log('Voice input deactivated');
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: 'Project Status', message: 'What is the status of our current projects?' },
    { label: 'Q-VAN Update', message: 'Tell me about Q-VAN' },
    { label: 'Financial Overview', message: 'What is our ROI target?' },
    { label: 'Generate Report', message: 'Generate an executive report' }
  ];

  const handleQuickAction = (message) => {
    sendMessage(message);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed right-6 bottom-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Emma</h3>
              <p className="text-blue-100 text-xs">Executive Meta Mind Advisor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onMinimize}
              className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 py-8">
                  <p className="mb-4">Start a conversation with Emma</p>
                  <div className="grid grid-cols-2 gap-2 px-2">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(action.message)}
                        className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.isError
                        ? 'bg-red-900/30 text-red-200 border border-red-800'
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.usedFallback && !message.isError && (
                      <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700">
                        ðŸ’¡ Fallback mode â€¢ OpenAI API unavailable
                      </p>
                    )}
                    
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-700">
                        {message.actions.map((action, idx) => (
                          <span key={idx} className="text-xs text-blue-300">
                            âš¡ Action: {action.action}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-2">
                    <Loader2 className="animate-spin text-blue-400" size={16} />
                    <span className="text-sm text-slate-300">Emma is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-700 bg-slate-900 p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`p-2 rounded-lg transition-colors ${
                    isVoiceActive
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={isVoiceActive ? "Stop voice input" : "Start voice input"}
                >
                  {isVoiceActive ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Emma anything..."
                  disabled={isLoading}
                  className="flex-1 bg-slate-800 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                  title="Send message"
                >
                  <Send size={20} />
                </button>
              </form>

              <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                <span>Session: {sessionId?.substring(0, 12)}...</span>
                <span>{messages.filter(m => m.role === 'user').length} messages</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmmaChat;
