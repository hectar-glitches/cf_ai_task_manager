#!/bin/bash

echo "🚀 Deploying cf_ai_task_manager to Cloudflare..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build

# Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=cf-ai-task-manager

echo "✅ Deployment complete!"
echo "📍 Your app should be live at: https://cf-ai-task-manager.pages.dev"
