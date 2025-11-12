#!/bin/bash
set -euo pipefail

### 1) Kill existing processes
echo "🔪 Killing old dev processes..."
pkill -f "scripts/dev-session.js" || true
pkill -f "nx serve" || true
pkill -f "pnpm run build:agent-framework" || true
pkill -f "pnpm run dev:" || true
pkill -f "nx serve" || true
pkill -f "pnpm run build:agent-framework" || true
pkill -f "pnpm run dev:" || true
sleep 0.4

### Start docker compose
echo "🐳 Starting docker compose..."
docker compose up -d


### 2) Start services with health checks
echo "🚀 Starting services..."

# Build agent framework first
echo "📦 Building agent framework..."
pnpm run build:agent-framework

# Start moodle-mcp first and wait for it to be healthy
echo "🔄 Starting moodle-mcp server..."
osascript <<'APPLESCRIPT'
tell application id "com.mitchellh.ghostty" to activate
delay 0.2

tell application "System Events"
  keystroke "t" using {command down}
  delay 0.15
  keystroke "printf '\\e]2;moodle-mcp\\a'; pnpm run dev:moodle-mcp"
  key code 36
  delay 0.2
end tell
APPLESCRIPT

# Wait for moodle-mcp to be healthy
echo "⏳ Waiting for moodle-mcp to be ready..."
MOODLE_MCP_URL="http://localhost:3003"  # Adjust port if needed
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s -f "$MOODLE_MCP_URL/functions" > /dev/null 2>&1; then
    echo "✅ moodle-mcp is healthy!"
    break
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  echo "⏳ Attempt $ATTEMPT/$MAX_ATTEMPTS - waiting for moodle-mcp..."
  sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "❌ moodle-mcp failed to start within expected time"
  kill $MOODLE_MCP_PID 2>/dev/null || true
  exit 1
fi

# Start calendar-mcp and wait for it to be healthy
echo "🔄 Starting calendar-mcp server..."
osascript <<'APPLESCRIPT'
tell application id "com.mitchellh.ghostty" to activate
delay 0.2

tell application "System Events"
  keystroke "t" using {command down}
  delay 0.15
  keystroke "printf '\\e]2;calendar-mcp\\a'; pnpm run dev:calendar-mcp"
  key code 36
  delay 0.2
end tell
APPLESCRIPT

# Wait for calendar-mcp to be healthy
echo "⏳ Waiting for calendar-mcp to be ready..."
CALENDAR_MCP_URL="http://localhost:3004"  # Adjust port if needed
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s -f "$CALENDAR_MCP_URL/functions" > /dev/null 2>&1; then
    echo "✅ calendar-mcp is healthy!"
    break
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  echo "⏳ Attempt $ATTEMPT/$MAX_ATTEMPTS - waiting for calendar-mcp..."
  sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "❌ calendar-mcp failed to start within expected time"
  kill $CALENDAR_MCP_PID 2>/dev/null || true
  exit 1
fi

# Now start the remaining services
echo "🔄 Starting routing-agent..."
osascript <<'APPLESCRIPT'
tell application id "com.mitchellh.ghostty" to activate
delay 0.05

tell application "System Events"
  keystroke "t" using {command down}
  delay 0.15
  keystroke "printf '\\e]2;routing-agent\\a'; pnpm run dev:routing-agent"
  key code 36
  delay 0.2
end tell
APPLESCRIPT

echo "🔄 Starting moodle-agent..."
osascript <<'APPLESCRIPT'
tell application id "com.mitchellh.ghostty" to activate
delay 0.05

tell application "System Events"
  keystroke "t" using {command down}
  delay 0.15
  keystroke "printf '\\e]2;moodle-agent\\a'; pnpm run dev:moodle-agent"
  key code 36
  delay 0.2
end tell
APPLESCRIPT

echo "🔄 Starting calendar-agent..."
osascript <<'APPLESCRIPT'
tell application id "com.mitchellh.ghostty" to activate
delay 0.05

tell application "System Events"
  keystroke "t" using {command down}
  delay 0.15
  keystroke "printf '\\e]2;calendar-agent\\a'; pnpm run dev:calendar-agent"
  key code 36
  delay 0.2
end tell
APPLESCRIPT

echo "✅ All services started in separate Ghostty tabs!"
echo ""
echo "Services running:"
echo "  - moodle-mcp (first tab)"
echo "  - calendar-mcp (second tab)"
echo "  - routing-agent (third tab)"
echo "  - moodle-agent (fourth tab)"
echo "  - calendar-agent (fifth tab)"
echo ""
echo "💡 Each service runs in its own tab with live output"
echo "🛑 To stop services, use Ctrl+C in each tab or close the tabs"
