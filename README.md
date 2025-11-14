# cf_ai_task_manager

An intelligent AI-powered task management system built on Cloudflare's platform, featuring real-time chat, natural language processing with Llama 3.3, and automated workflow coordination.

## 🚀 Features

- **AI-Powered Chat Interface**: Natural language interaction with Llama 3.3 70B model
- **Real-time Communication**: WebSocket-based chat with instant updates
- **Smart Task Management**: Create, update, and organize tasks through conversational AI
- **Persistent State**: Durable Objects with SQLite for reliable data storage
- **Automated Workflows**: Intelligent reminders and task scheduling
- **Analytics Dashboard**: Productivity insights and task analytics
- **Responsive Frontend**: Modern React interface deployed on Cloudflare Pages

## 🏗️ Architecture

### Core Components

1. **TaskManagerAgent** (Durable Object)
   - Extends Cloudflare Agents SDK
   - Handles state management with SQLite
   - Processes natural language with Workers AI
   - Manages WebSocket connections

2. **Workers AI Integration**
   - Llama 3.3 70B Instruct model (`@cf/meta/llama-3.3-70b-instruct`)
   - Natural language understanding for task operations
   - Intent detection and action extraction

3. **Frontend Application**
   - React with TypeScript
   - Real-time WebSocket communication
   - Responsive design with Tailwind CSS
   - Deployed on Cloudflare Pages

4. **Workflow Coordination**
   - Automated task reminders
   - Scheduled notifications
   - Background processing

## 🛠️ Technology Stack

- **Backend**: Cloudflare Workers, Durable Objects, Workers AI
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **AI Model**: Llama 3.3 70B Instruct
- **Database**: SQLite (via Durable Objects)
- **Real-time**: WebSockets
- **Deployment**: Cloudflare Workers & Pages

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account
- Wrangler CLI

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd cf_ai_task_manager

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Cloudflare

Create a `.env` file in the root directory:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

Update `wrangler.toml` with your account details:

```toml
name = "cf_ai_task_manager"
main = "src/index.ts"
compatibility_date = "2024-11-14"

[env.production.vars]
# Add your environment variables here

[[durable_objects.bindings]]
name = "TASK_MANAGER_AGENT"
class_name = "TaskManagerAgent"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["TaskManagerAgent"]

[ai]
binding = "AI"

[workflows]
binding = "WORKFLOWS"
```

### 3. Development Setup

Start the backend development server:

```bash
npm run dev
```

In a separate terminal, start the frontend development server:

```bash
cd frontend
npm run dev
```

The application will be available at:
- Backend: `http://localhost:8787`
- Frontend: `http://localhost:3000`

## 🚀 Deployment

### Deploy Backend (Workers)

```bash
# Build and deploy the worker
npm run build
npm run deploy
```

### Deploy Frontend (Pages)

```bash
# Build and deploy to Cloudflare Pages
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=cf-ai-task-manager
```

### Environment Setup

After deployment, configure your production environment:

1. Set up custom domain (optional)
2. Configure environment variables in Cloudflare dashboard
3. Update frontend API endpoints for production

## 💬 Usage Examples

### Creating Tasks via Chat

```
User: "Create a task to review the quarterly report by Friday"
AI: "I've created a new task: 'Review quarterly report' with a due date of Friday. Would you like me to add any specific details or set a priority level?"

User: "Make it high priority and add a reminder for tomorrow"
AI: "Perfect! I've updated the task to high priority and scheduled a reminder for tomorrow. The task is now ready in your task list."
```

### Task Management Commands

```
User: "Show me all my pending tasks"
AI: "Here are your pending tasks: [lists tasks]"

User: "Mark the report review as completed"
AI: "Great job! I've marked 'Review quarterly report' as completed."

User: "What's my productivity score this week?"
AI: "This week you've completed 8 out of 10 tasks, giving you an 80% productivity score. You're doing great!"
```

## 🔧 API Endpoints

### REST API

- `GET /api/health` - Health check
- `GET /api/tasks` - Get tasks (with filtering)
- `POST /api/tasks` - Create new task
- `POST /api/chat` - Send chat message
- `GET /api/analytics` - Get user analytics

### WebSocket Events

#### Client → Server
```json
{
  "type": "chat_message",
  "userId": "user_id",
  "content": "message content"
}
```

#### Server → Client
```json
{
  "type": "message_response",
  "message": {
    "id": "msg_id",
    "content": "AI response",
    "timestamp": "2024-11-14T10:00:00Z",
    "type": "agent"
  }
}
```

## 🎯 Key Features Detail

### Natural Language Processing

The AI assistant can understand and process various types of requests:

- **Task Creation**: "Add a meeting with John tomorrow at 3pm"
- **Task Updates**: "Change the priority of the report to urgent"
- **Task Queries**: "What tasks do I have due this week?"
- **Analytics**: "How am I doing with my tasks this month?"

### State Management

- **Persistent Storage**: All data stored in SQLite via Durable Objects
- **Real-time Sync**: State synchronized across all connected clients
- **Automatic Backups**: Durable Objects ensure data persistence

### Workflow Automation

- **Smart Reminders**: AI-scheduled reminders based on due dates
- **Priority Escalation**: Automatic priority increases for overdue tasks
- **Productivity Insights**: Weekly/monthly productivity analysis

## 🔍 Monitoring & Analytics

### Built-in Analytics

- Total tasks created/completed
- Productivity score calculation
- Overdue task tracking
- Task completion trends

### Performance Monitoring

- WebSocket connection status
- API response times
- AI model inference metrics

## 🛡️ Security & Privacy

- **Data Isolation**: Each user's data isolated in separate Durable Object instances
- **Secure Communication**: WebSocket and HTTPS encryption
- **Privacy First**: No personal data stored beyond task information
- **Cloudflare Security**: Built-in DDoS protection and security features

## 🔧 Configuration Options

### Environment Variables

```env
# Production URLs (update after deployment)
VITE_API_URL=https://your-worker.your-subdomain.workers.dev
VITE_WS_URL=wss://your-worker.your-subdomain.workers.dev

# Development settings
VITE_DEV_API_URL=http://localhost:8787/api
VITE_DEV_WS_URL=ws://localhost:8787
```

### Customization

- **AI Model**: Change model in `src/agent.ts` (line 115)
- **Reminder Intervals**: Modify in `src/agent.ts` (line 14)
- **UI Theme**: Update Tailwind CSS classes in components
- **Chat Behavior**: Customize system prompts in `processWithAI` method

## 📊 Performance Optimization

### Backend Optimizations

- **Durable Objects**: Automatic scaling and performance
- **Workers AI**: Global edge inference
- **SQLite**: Efficient local database operations
- **Connection Pooling**: WebSocket connection management

### Frontend Optimizations

- **Code Splitting**: Vite-based bundling
- **Lazy Loading**: Component-level optimization
- **Caching**: Service worker integration (optional)
- **CDN**: Cloudflare Pages global distribution

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if worker is deployed and accessible
   - Verify WebSocket upgrade headers
   - Check firewall/proxy settings

2. **AI Responses Not Working**
   - Verify Workers AI binding in wrangler.toml
   - Check account has Workers AI access
   - Monitor inference limits

3. **Tasks Not Persisting**
   - Verify Durable Objects binding
   - Check SQLite migrations
   - Monitor storage quotas

### Debug Commands

```bash
# Check worker logs
wrangler tail

# Test API endpoints
curl https://your-worker.workers.dev/api/health

# Monitor WebSocket connection
# Use browser dev tools Network tab
```

## 🚧 Future Improvements

- [ ] Voice input/output integration
- [ ] Mobile app development
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features
- [ ] Integration with external calendars
- [ ] Multi-language support
- [ ] Advanced AI model fine-tuning

## 🤝 Contributing

This project was built as part of a Cloudflare assignment. The codebase demonstrates:

- Modern AI application architecture
- Cloudflare platform integration
- Real-time web application development
- Natural language processing implementation

## 📄 License

MIT License - feel free to use this code as a reference for your own Cloudflare AI applications.

---

**Built with ❤️ on Cloudflare Platform**

*Showcasing the power of Workers, Durable Objects, Workers AI, and Pages working together to create intelligent, scalable applications.*