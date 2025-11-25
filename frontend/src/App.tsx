import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  type: 'user' | 'agent';
}

function App() {
  const API_BASE_URL = import.meta.env.MODE === 'production'
    ? 'https://cf-ai-task-manager-v2.cf-ai-task-manager.workers.dev'
    : '';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      timestamp: new Date().toISOString(),
      type: 'user'
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          message: inputMessage,
          history: currentMessages.slice(-10).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: data.message.id,
        content: data.message.content,
        timestamp: data.message.timestamp,
        type: 'agent'
      }]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">R</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Research Agent</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="container mx-auto max-w-6xl px-6 py-8 min-h-[calc(100vh-200px)]">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-[60vh]">
            <p className="text-gray-400">Ask me about research topics, sources, or methodologies</p>
          </div>
        )}

        <div className="space-y-8">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className="text-xs font-medium text-gray-500 mb-2">
                {msg.type === 'user' ? 'You' : 'Assistant'}
              </div>
              <div className="text-[15px] leading-relaxed text-gray-900">
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">Assistant</div>
              <div className="text-[15px] text-gray-400">Just a sec...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white sticky bottom-0">
        <div className="container mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 text-[15px]"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-gray-900 text-white text-[15px] rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
