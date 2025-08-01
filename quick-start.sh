#!/bin/bash

# PayUS Quick Start Script
# This script helps set up the PayUS application quickly

echo "🚀 PayUS Quick Start Script"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) and npm $(npm -v) are installed"

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB:"
    echo "   macOS: brew services start mongodb-community"
    echo "   Ubuntu: sudo systemctl start mongod"
    echo "   Windows: net start MongoDB"
    echo ""
    read -p "Press Enter to continue anyway..."
fi

# Backend Setup
echo ""
echo "📦 Setting up Backend..."
cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your configuration"
else
    echo "✅ .env file already exists"
fi

cd ..

# Mobile Setup
echo ""
echo "📱 Setting up Mobile App..."
cd mobile

# Install dependencies
echo "Installing mobile dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# API Configuration
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=10000

# App Configuration
APP_NAME=PayUS
APP_VERSION=1.0.0
EOF
    echo "✅ Created mobile/.env file"
else
    echo "✅ .env file already exists"
fi

cd ..

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure environment variables:"
echo "   - Edit backend/.env with your MongoDB, JWT, and notification settings"
echo "   - Edit mobile/.env if needed"
echo ""
echo "2. Start the backend server:"
echo "   cd backend && npm run dev"
echo ""
echo "3. Start the mobile app:"
echo "   cd mobile && npx react-native run-android  # For Android"
echo "   cd mobile && npx react-native run-ios      # For iOS"
echo ""
echo "4. Test the API:"
echo "   curl http://localhost:3000/health"
echo ""
echo "📚 For detailed setup instructions, see SETUP.md"
echo "🐛 For troubleshooting, see the troubleshooting section in SETUP.md"
echo ""
echo "Happy coding! 🚀"