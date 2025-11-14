import { Agent } from "./base-agent";
import { Task, User, ChatMessage, AgentState } from "./types";
import { Env } from "./env";

export class TaskManagerAgent extends Agent {
  private state: AgentState;

  constructor(state: any, env: Env) {
    super(state, env);
    this.state = {
      tasks: [],
      users: [],
      chatHistory: [],
      activeConversations: new Map(),
      preferences: {
        reminderIntervals: [1, 24, 168], // 1 hour, 1 day, 1 week in hours
        workingHours: { start: 9, end: 17 }
      }
    };
  }

  async initialize() {
    // Load persisted state from SQL database
    const savedState = await this.sql.prepare("SELECT * FROM agent_state WHERE id = ?").bind("main").first();
    if (savedState) {
      this.state = JSON.parse(savedState.data as string);
    }
  }

  /**
   * Handle incoming chat messages and process them with AI
   */
  async processMessage(userId: string, message: string): Promise<ChatMessage> {
    const timestamp = new Date().toISOString();
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store user message
    const userMessage: ChatMessage = {
      id: messageId,
      userId,
      content: message,
      timestamp,
      type: 'user'
    };

    this.state.chatHistory.push(userMessage);

    // Process with Llama 3.3
    const aiResponse = await this.processWithAI(userId, message);
    
    // Store agent response
    const agentMessage: ChatMessage = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      content: aiResponse.content,
      timestamp: new Date().toISOString(),
      type: 'agent',
      metadata: aiResponse.metadata
    };

    this.state.chatHistory.push(agentMessage);

    // Execute any actions identified by AI
    if (aiResponse.metadata?.action) {
      await this.executeAction(userId, aiResponse.metadata.action, aiResponse.metadata);
    }

    // Persist state
    await this.saveState();

    // Broadcast to connected clients
    this.broadcast({
      type: 'new_message',
      message: agentMessage
    });

    return agentMessage;
  }

  /**
   * Process message with Llama 3.3 using Workers AI
   */
  private async processWithAI(userId: string, message: string): Promise<{
    content: string;
    metadata: {
      action?: string;
      taskId?: string;
      confidence: number;
    }
  }> {
    const user = this.state.users.find(u => u.id === userId);
    const recentTasks = this.state.tasks.filter(t => 
      new Date(t.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).slice(-10);

    const systemPrompt = `You are a helpful AI task management assistant. You can help users:
1. Create new tasks
2. Update existing tasks  
3. Delete tasks
4. Search and filter tasks
5. Set reminders and due dates
6. Organize tasks by priority and tags

Current user context:
- User ID: ${userId}
- Recent tasks: ${JSON.stringify(recentTasks, null, 2)}
- Current time: ${new Date().toISOString()}

When responding, determine if the user wants to perform an action and include metadata:
- action: create_task, update_task, delete_task, search_tasks, set_reminder, etc.
- taskId: if referring to specific task
- confidence: 0-1 how confident you are about the intended action

Be conversational and helpful. Ask for clarification if needed.`;

    const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      stream: false
    });

    // Parse AI response for actions
    const content = response.response || "I'm sorry, I couldn't process that request.";
    let action = undefined;
    let taskId = undefined;
    let confidence = 0.7;

    // Simple action detection (in a real app, you might use more sophisticated NLP)
    if (message.toLowerCase().includes('create') || message.toLowerCase().includes('add') || message.toLowerCase().includes('new')) {
      action = 'create_task';
      confidence = 0.8;
    } else if (message.toLowerCase().includes('update') || message.toLowerCase().includes('change') || message.toLowerCase().includes('modify')) {
      action = 'update_task';
      confidence = 0.7;
    } else if (message.toLowerCase().includes('delete') || message.toLowerCase().includes('remove') || message.toLowerCase().includes('cancel')) {
      action = 'delete_task';
      confidence = 0.8;
    } else if (message.toLowerCase().includes('list') || message.toLowerCase().includes('show') || message.toLowerCase().includes('find')) {
      action = 'search_tasks';
      confidence = 0.9;
    }

    return {
      content,
      metadata: {
        action,
        taskId,
        confidence
      }
    };
  }

  /**
   * Execute actions identified by the AI
   */
  private async executeAction(userId: string, action: string, metadata: any): Promise<void> {
    switch (action) {
      case 'create_task':
        await this.createTaskFromMessage(userId, metadata);
        break;
      case 'update_task':
        await this.updateTask(metadata.taskId, metadata);
        break;
      case 'delete_task':
        await this.deleteTask(metadata.taskId);
        break;
      case 'search_tasks':
        await this.searchTasks(userId, metadata);
        break;
      case 'set_reminder':
        await this.scheduleReminder({
          id: metadata.taskId,
          dueDate: metadata.reminderTime
        } as Task);
        break;
    }
  }

  /**
   * Create a new task
   */
  async createTask(userId: string, taskData: Partial<Task>): Promise<Task> {
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'pending',
      dueDate: taskData.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: taskData.tags || []
    };

    this.state.tasks.push(task);
    await this.saveState();

    // Schedule reminder workflow if due date is set
    if (task.dueDate) {
      await this.scheduleReminder(task);
    }

    this.broadcast({
      type: 'task_created',
      task
    });

    return task;
  }

  /**
   * Create task from natural language message
   */
  private async createTaskFromMessage(userId: string, metadata: any): Promise<Task | null> {
    // Use AI to extract task details from the conversation context
    const recentMessages = this.state.chatHistory
      .filter(m => m.userId === userId)
      .slice(-5)
      .map(m => m.content)
      .join('\n');

    const extractionPrompt = `Extract task information from this conversation:
${recentMessages}

Return JSON with: title, description, priority (low/medium/high/urgent), dueDate (ISO string or null), tags (array)`;

    const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
      messages: [
        { role: 'system', content: 'You are a task extraction assistant. Return only valid JSON.' },
        { role: 'user', content: extractionPrompt }
      ],
      stream: false
    });

    try {
      const taskData = JSON.parse(response.response);
      return await this.createTask(userId, taskData);
    } catch (error) {
      console.error('Failed to extract task data:', error);
      return null;
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const taskIndex = this.state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;

    this.state.tasks[taskIndex] = {
      ...this.state.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveState();

    this.broadcast({
      type: 'task_updated',
      task: this.state.tasks[taskIndex]
    });

    return this.state.tasks[taskIndex];
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<boolean> {
    const initialLength = this.state.tasks.length;
    this.state.tasks = this.state.tasks.filter(t => t.id !== taskId);
    
    if (this.state.tasks.length < initialLength) {
      await this.saveState();
      this.broadcast({
        type: 'task_deleted',
        taskId
      });
      return true;
    }
    
    return false;
  }

  /**
   * Search and filter tasks
   */
  async searchTasks(userId: string, criteria: any = {}): Promise<Task[]> {
    let filteredTasks = this.state.tasks;

    if (criteria.status) {
      filteredTasks = filteredTasks.filter(t => t.status === criteria.status);
    }

    if (criteria.priority) {
      filteredTasks = filteredTasks.filter(t => t.priority === criteria.priority);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      filteredTasks = filteredTasks.filter(t => 
        criteria.tags.some((tag: string) => t.tags.includes(tag))
      );
    }

    if (criteria.search) {
      const searchTerm = criteria.search.toLowerCase();
      filteredTasks = filteredTasks.filter(t => 
        t.title.toLowerCase().includes(searchTerm) ||
        t.description.toLowerCase().includes(searchTerm)
      );
    }

    return filteredTasks;
  }

  /**
   * Schedule reminders using Workflows
   */
  private async scheduleReminder(task: Task): Promise<void> {
    if (!task.dueDate) return;

    const dueDate = new Date(task.dueDate);
    const now = new Date();

    // Schedule reminders at different intervals before due date
    for (const interval of this.state.preferences.reminderIntervals) {
      const reminderTime = new Date(dueDate.getTime() - interval * 60 * 60 * 1000);
      
      if (reminderTime > now) {
        await this.schedule(
          'sendReminder',
          { taskId: task.id, reminderType: `${interval}h_before` },
          { delay: reminderTime.getTime() - now.getTime() }
        );
      }
    }
  }

  /**
   * Send reminder (called by workflow)
   */
  async sendReminder(taskId: string, reminderType: string): Promise<void> {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task || task.status === 'completed') return;

    const reminderMessage: ChatMessage = {
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'system',
      content: `Reminder: "${task.title}" is due ${task.dueDate ? new Date(task.dueDate).toLocaleString() : 'soon'}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      metadata: {
        taskId: task.id,
        action: 'reminder'
      }
    };

    this.state.chatHistory.push(reminderMessage);
    await this.saveState();

    this.broadcast({
      type: 'reminder',
      message: reminderMessage,
      task
    });
  }

  /**
   * Handle WebSocket connections
   */
  async webSocketMessage(websocket: any, message: string): Promise<void> {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'chat_message':
          const response = await this.processMessage(data.userId, data.content);
          websocket.send(JSON.stringify({
            type: 'message_response',
            message: response
          }));
          break;

        case 'get_tasks':
          const tasks = await this.searchTasks(data.userId, data.criteria);
          websocket.send(JSON.stringify({
            type: 'tasks_list',
            tasks
          }));
          break;

        case 'create_task':
          const newTask = await this.createTask(data.userId, data.taskData);
          websocket.send(JSON.stringify({
            type: 'task_created',
            task: newTask
          }));
          break;

        case 'update_task':
          const updatedTask = await this.updateTask(data.taskId, data.updates);
          websocket.send(JSON.stringify({
            type: 'task_updated',
            task: updatedTask
          }));
          break;

        case 'delete_task':
          const deleted = await this.deleteTask(data.taskId);
          websocket.send(JSON.stringify({
            type: 'task_deleted',
            success: deleted,
            taskId: data.taskId
          }));
          break;
      }
    } catch (error) {
      websocket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  }

  /**
   * Handle WebSocket connections
   */
  async webSocketConnect(websocket: any): Promise<void> {
    websocket.accept();
    
    // Send initial state to new client
    websocket.send(JSON.stringify({
      type: 'connection_established',
      recentMessages: this.state.chatHistory.slice(-20),
      taskCount: this.state.tasks.length
    }));
  }

  /**
   * Save state to SQL database
   */
  private async saveState(): Promise<void> {
    await this.sql
      .prepare("INSERT OR REPLACE INTO agent_state (id, data, updated_at) VALUES (?, ?, ?)")
      .bind("main", JSON.stringify(this.state), new Date().toISOString())
      .run();
  }

  /**
   * Register a new user
   */
  async registerUser(userData: Partial<User>): Promise<User> {
    const user: User = {
      id: userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: userData.name || 'Anonymous User',
      preferences: {
        timezone: userData.preferences?.timezone || 'UTC',
        reminderPreferences: userData.preferences?.reminderPreferences || ['email', 'push']
      }
    };

    this.state.users.push(user);
    await this.saveState();

    return user;
  }

  /**
   * Get user tasks with analytics
   */
  async getUserAnalytics(userId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    productivityScore: number;
  }> {
    const userTasks = this.state.tasks;
    const now = new Date();

    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(t => t.status === 'completed').length;
    const pendingTasks = userTasks.filter(t => t.status === 'pending').length;
    const overdueTasks = userTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
    ).length;

    const productivityScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      productivityScore: Math.round(productivityScore)
    };
  }
}