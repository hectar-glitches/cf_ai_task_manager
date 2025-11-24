import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, CheckCircle, Circle, Clock, AlertTriangle, BarChart3, MessageSquare, List } from 'lucide-react';

// Types
interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  type: 'user' | 'agent' | 'system';
  metadata?: {
    taskId?: string;
    action?: string;
    confidence?: number;
  };
}

interface Analytics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  productivityScore: number;
}

const API_BASE = '/api';

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks' | 'analytics'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const isConnected = true; // Always connected via HTTP - much simpler!
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial data
  useEffect(() => {
    loadTasks();
    loadAnalytics();
  }, []);

  // Simple HTTP-based messaging - no WebSocket complexity!

  const sendMessage = async () => {
    if (!inputMessage.trim() || !isConnected) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      content: inputMessage,
      timestamp: new Date().toISOString(),
      type: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simple HTTP API call - much simpler!
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: inputMessage })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        // Refresh tasks and analytics after chat
        loadTasks();
        loadAnalytics();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setIsLoading(false);
  };

  const loadTasks = async () => {
    try {
      const response = await fetch(`${API_BASE}/tasks?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        loadTasks(); // Refresh tasks
        loadAnalytics(); // Refresh analytics
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Circle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Circle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Task Manager</h1>
                <p className="text-sm text-gray-500">
                  Powered by Cloudflare & Llama 3.3 • Active: {activeTab}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Always Visible */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <nav className="flex justify-center px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg m-4">
            {[
              { id: 'chat', icon: MessageSquare, label: 'Chat' },
              { id: 'tasks', icon: List, label: 'Tasks' },
              { id: 'analytics', icon: BarChart3, label: 'Analytics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-hidden">

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
            <div className="flex flex-col flex-1">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Start a conversation with your AI assistant!</p>
                    <p className="text-sm mt-1">Try: "Create a task to review project proposal"</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 
                      message.type === 'system' ? 'justify-center' : 'justify-start'}`}
                  >
                    <div className={`message-bubble ${
                      message.type === 'user' ? 'message-user' :
                      message.type === 'system' ? 'message-system' : 'message-agent'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {formatTimestamp(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="message-bubble message-agent">
                      <div className="loading-dots">Thinking</div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!isConnected}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || !isConnected || isLoading}
                    className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Your Tasks</h2>
                <button
                  onClick={() => {
                    setActiveTab('chat');
                    setInputMessage('Create a new task');
                  }}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Task</span>
                </button>
              </div>

            <div className="grid gap-4">
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <List className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No tasks yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Chat with the AI to create your first task
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`task-card bg-white rounded-lg border p-4 priority-${task.priority}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <button
                            onClick={() => updateTaskStatus(
                              task.id, 
                              task.status === 'completed' ? 'pending' : 'completed'
                            )}
                          >
                            {getStatusIcon(task.status)}
                          </button>
                          <h3 className={`font-medium ${
                            task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </h3>
                          {getPriorityIcon(task.priority)}
                        </div>
                        
                        {task.description && (
                          <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status.replace('-', ' ')}
                          </span>
                          
                          {task.dueDate && (
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                        
                        {task.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {task.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-900">Task Analytics</h2>
            
            {analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalTasks}</p>
                    </div>
                    <List className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{analytics.completedTasks}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{analytics.pendingTasks}</p>
                    </div>
                    <Circle className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{analytics.overdueTasks}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Score</p>
                      <p className="text-2xl font-bold text-blue-600">{analytics.productivityScore}%</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border p-8 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Loading analytics...</p>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;