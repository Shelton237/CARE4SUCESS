#!/bin/bash

# Configuration
PROJECT_DIR="/var/www/CARE4SUCESS"
DOMAIN="care4success.usra-care.com"

echo "🚀 Starting deployment for $DOMAIN..."

# Navigate to project directory
cd $PROJECT_DIR || exit

# Pull latest changes (make sure your repo is set up with SSH)
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build Frontend
echo "🏗️  Building Frontend..."
npm run build

# Restart Backend with PM2
echo "🔄 Restarting Backend API..."
pm2 startOrRestart ecosystem.config.cjs --env production

echo "✅ Deployment completed!"
echo "Note: Ensure your .env.local on the server is configured with production DB credentials."
