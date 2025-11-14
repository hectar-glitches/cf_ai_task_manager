#!/bin/bash

# Development startup script for cf_ai_task_manager
# This script starts both backend and frontend development servers

set -e

echo "🚀 Starting cf_ai_task_manager development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

# Install backend dependencies
if [ ! -d "node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    npm install
fi

# Install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo "✅ Dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Cloudflare configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here

# Development settings
NODE_ENV=development
EOF
    echo "⚠️  Please update .env file with your Cloudflare credentials"
fi

echo ""
echo "🔧 Starting development servers..."
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    jobs -p | xargs -r kill
    exit 0
}

# Set trap to cleanup on script termination
trap cleanup SIGINT SIGTERM

# Start backend development server
echo "🖥️  Starting backend server (http://localhost:8787)..."
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend development server
echo "🎨 Starting frontend server (http://localhost:3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Development servers started!"
echo ""
echo "📍 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8787/api"
echo "   WebSocket: ws://localhost:8787"
echo ""
echo "📝 Development tips:"
echo "   - Backend logs will appear in this terminal"
echo "   - Frontend will open automatically in your browser"
echo "   - Changes to backend require restart (Ctrl+C then ./dev.sh)"
echo "   - Frontend hot-reloads automatically"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"

# Wait for background processes
wait