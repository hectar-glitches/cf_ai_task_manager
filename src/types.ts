// Types for our task management system
export interface Task {
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

export interface User {
  id: string;
  name: string;
  preferences: {
    timezone: string;
    reminderPreferences: string[];
  };
}

export interface ChatMessage {
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

export interface AgentState {
  tasks: Task[];
  users: User[];
  chatHistory: ChatMessage[];
  activeConversations: Map<string, string>; // userId -> conversationId
  preferences: {
    reminderIntervals: number[];
    workingHours: { start: number; end: number };
  };
}