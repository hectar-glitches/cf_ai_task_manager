# Research agent

<img width="919" height="1051" alt="Screenshot 2025-11-25 at 11 07 23" src="https://github.com/user-attachments/assets/f98e426b-9266-4620-89ac-2c69d981e10f" />


An AI-powered research assistant built on Cloudflare's platform that helps you find and explore academic papers. Uses Llama 3.1 70B for intelligent intent detection and Semantic Scholar API for real academic paper retrieval - **zero hallucinations**.

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

1. **Workers AI Integration**
   - Llama 3.1 70B Instruct model (`@cf/meta/llama-3.1-70b-instruct`)
   - Intent detection: determines if user wants papers
   - Topic extraction: extracts research topic from queries
   - Fallback regex for offline/local development

2. **Semantic Scholar API**
   - Real academic paper database
   - Returns verified papers with citations, authors, venues
   - No API key required for basic usage
   - Fields: title, authors, year, venue, citations, URLs

3. **Frontend Application**
   - React with TypeScript
   - ReactMarkdown for beautiful formatting
   - Responsive design with Tailwind CSS
   - Deployed on Cloudflare Pages

4. **Anti-Hallucination Design**
   - Papers bypass AI completely
   - Pre-formatted in backend before response
   - Direct return prevents AI from making up citations
   - Verified Semantic Scholar URLs only

## 🛠️ Technology Stack

- **Backend**: Cloudflare Workers, Workers AI
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, ReactMarkdown
- **AI Model**: Llama 3.1 70B Instruct (intent detection only)
- **Paper Source**: Semantic Scholar Graph API
- **Deployment**: Cloudflare Workers & Pages
- **Development**: Node.js 20 (via Conda environment)

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

Update `wrangler.toml` with your account details:

```toml
name = "cf-ai-task-manager-v2"
main = "src/index.ts"
compatibility_date = "2024-11-14"
account_id = "your_account_id"

[ai]
binding = "AI"
```

Update frontend API URL in `frontend/src/App.tsx`:

```typescript
const API_URL = 'https://your-worker.workers.dev';
```

### 3. Development Setup

**Important**: Use Node.js 20+ (Wrangler requires it)

```bash
# If using conda:
conda create -n cf-ai-env nodejs=20
conda activate cf-ai-env

# Start backend (note: AI binding not supported locally)
npx wrangler dev --local

# In separate terminal, start frontend
cd frontend
npm run dev
```

The application will be available at:
- Backend: `http://localhost:8787` (AI features require deployment)
- Frontend: `http://localhost:5173`

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
