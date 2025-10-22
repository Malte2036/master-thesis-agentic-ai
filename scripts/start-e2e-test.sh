#!/bin/bash

# Parse command line arguments
MCP_ONLY=false
HELP=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --mcp-only)
      MCP_ONLY=true
      shift
      ;;
    --help|-h)
      HELP=true
      shift
      ;;
    *)
      echo "Unknown option $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Show help if requested
if [ "$HELP" = true ]; then
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --mcp-only    Start only the moodle-mcp service"
  echo "  --help, -h    Show this help message"
  echo ""
  echo "This script starts the e2e test environment with WireMock and services."
  echo ""
  echo "Examples:"
  echo "  $0             # Start all services (moodle-mcp + moodle-agent + routing-agent)"
  echo "  $0 --mcp-only  # Start only moodle-mcp"
  exit 0
fi

# Build agent framework first
echo "🔨 Building agent framework..."
pnpm run build:agent-framework
if [ $? -ne 0 ]; then
  echo "❌ Failed to build agent framework. Exiting."
  exit 1
fi
echo "✅ Agent framework built successfully!"

# Start wiremock in the background
echo "Starting WireMock..."
docker-compose -f docker-compose.test.yml up -d wiremock

# Wait for WireMock to be healthy
echo "Waiting for WireMock to be ready..."
until curl --output /dev/null --silent --fail http://localhost:8081/__admin/health; do
  printf '.'
  sleep 1
done
echo "WireMock is up and running!"

# Run moodle-mcp with environment variables
export MOODLE_BASE_URL="http://localhost:8081"
export MOODLE_TOKEN="test-token"

echo "Starting moodle-mcp with the following environment variables:"
echo "MOODLE_BASE_URL: $MOODLE_BASE_URL"
echo "MOODLE_TOKEN: $MOODLE_TOKEN"

# Start services based on options
if [ "$MCP_ONLY" = true ]; then
  echo "🚀 Starting moodle-mcp only in current tab..."
  echo "🔄 Starting moodle-mcp..."
  echo ""
  echo "💡 Service will run in the current terminal"
  echo "🛑 To stop service, use Ctrl+C"
  echo ""
  
  # Start moodle-mcp in current tab
  pnpm run dev:moodle-mcp
else
  echo "🚀 Starting all services..."
  echo "🔄 Starting moodle-mcp in current tab..."
  echo "🔄 Starting moodle-agent in new tab..."
  echo "🔄 Starting routing-agent in new tab..."
  
  # Start moodle-agent in a new tab
  osascript <<'APPLESCRIPT'
tell application id "com.mitchellh.ghostty" to activate
delay 0.2

tell application "System Events"
  keystroke "t" using {command down}
  delay 0.15
  keystroke "printf '\\e]2;moodle-agent\\a'; pnpm run dev:moodle-agent"
  key code 36
  delay 0.2
end tell
APPLESCRIPT

  echo "✅ moodle-agent started in new tab!"
  
  # Start routing-agent in a new tab
  osascript <<'APPLESCRIPT'
tell application id "com.mitchellh.ghostty" to activate
delay 0.2

tell application "System Events"
  keystroke "t" using {command down}
  delay 0.15
  keystroke "printf '\\e]2;routing-agent\\a'; pnpm run dev:routing-agent"
  key code 36
  delay 0.2
end tell
APPLESCRIPT

  echo "✅ routing-agent started in new tab!"

  echo ""
  echo "Services running:"
  echo "  - moodle-mcp (current tab)"
  echo "  - moodle-agent (new tab)"
  echo "  - routing-agent (new tab)"
  echo ""
  echo "💡 moodle-mcp runs in current terminal, others in separate tabs"
  echo "🛑 To stop services, use Ctrl+C in current tab or close the other tabs"
  echo ""
  
  # Start moodle-mcp in current tab
  pnpm run dev:moodle-mcp
fi
