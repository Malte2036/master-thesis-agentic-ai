#!/bin/bash

# Start Services Script for E2E Testing
# This script helps start all required services for E2E testing

echo "🚀 Starting services for E2E testing..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm and try again."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Build the project
echo "🔨 Building project..."
pnpm build:dist

echo "✅ Project built successfully!"
echo ""
echo "📋 To run E2E tests, start these services in separate terminals:"
echo ""
echo "Terminal 1 (Routing Agent):"
echo "  pnpm dev:routing-agent"
echo ""
echo "Terminal 2 (Moodle Agent):"
echo "  pnpm dev:moodle-agent"
echo ""
echo "Terminal 3 (Moodle MCP - optional):"
echo "  pnpm dev:moodle-mcp"
echo ""
echo "Then run the E2E tests:"
echo "  pnpm test:e2e"
echo ""
echo "🎯 The test will connect to:"
echo "  - Routing Agent: http://localhost:3000"
echo "  - Moodle Agent: http://localhost:1234"


