#!/bin/bash

# Start the Cloudflare AI Task Manager
# Run this with: conda activate cf-ai-env && ./start.sh

echo "🚀 Starting cf_ai_task_manager..."
echo ""

# Start backend in background
echo "📡 Starting backend on http://localhost:8787..."
npx wrangler dev --local --port 8787 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend on http://localhost:5173..."
cd frontend && npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
