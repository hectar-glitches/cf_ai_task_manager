#!/bin/bash

# Deployment script for cf_ai_task_manager
# This script deploys both the backend Worker and frontend Pages

set -e  # Exit on any error

echo "🚀 Starting deployment of cf_ai_task_manager..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Cloudflare
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Please login to Cloudflare first:"
    echo "wrangler login"
    exit 1
fi

echo "✅ Cloudflare authentication confirmed"

# Deploy backend Worker
echo "📦 Building and deploying backend Worker..."
npm run build
npm run deploy

if [ $? -eq 0 ]; then
    echo "✅ Backend Worker deployed successfully"
else
    echo "❌ Backend deployment failed"
    exit 1
fi

# Deploy frontend to Pages
echo "🎨 Building and deploying frontend to Pages..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

# Build frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Deploy to Pages
echo "🌐 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=cf-ai-task-manager --compatibility-date=2024-11-14

if [ $? -eq 0 ]; then
    echo "✅ Frontend deployed to Pages successfully"
else
    echo "❌ Pages deployment failed"
    exit 1
fi

cd ..

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📍 Your application is now live:"
echo "   Backend Worker: https://cf-ai-task-manager.your-subdomain.workers.dev"
echo "   Frontend Pages: https://cf-ai-task-manager.pages.dev"
echo ""
echo "🔧 Next steps:"
echo "1. Update frontend API URLs in production build"
echo "2. Configure custom domain (optional)"
echo "3. Set up monitoring and analytics"
echo "4. Test all functionality in production environment"
echo ""
echo "📚 Documentation: See README.md for detailed usage instructions"