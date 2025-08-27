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

### 2) Open Ghostty in the current directory
open -na "Ghostty" --args --working-directory="$PWD"
sleep 0.5

### 3) Add tabs for each command (no calendar-mcp) and maximize window
osascript <<'APPLESCRIPT'
tell application id "com.mitchellh.ghostty" to activate
delay 0.2

tell application "System Events"
  set titles to {"routing-agent", "moodle-agent", "moodle-mcp", "chainlit"}
  set commands to {"pnpm run build:agent-framework && pnpm run dev:routing-agent", "pnpm run build:agent-framework && pnpm run dev:moodle-agent", "pnpm run build:agent-framework && pnpm run dev:moodle-mcp", "pnpm run build:agent-framework && pnpm run dev:chainlit"}

  -- Maximize the frontmost Ghostty window (not fullscreen)
  tell application "Finder"
    set screenBounds to bounds of window of desktop
  end tell
  tell application process "Ghostty"
    set position of front window to {item 1 of screenBounds, item 2 of screenBounds}
    set size of front window to {item 3 of screenBounds, item 4 of screenBounds}
  end tell
  delay 0.1

  repeat with i from 1 to (count of titles)
    tell application id "com.mitchellh.ghostty" to activate
    delay 0.05

    if i is not 1 then
      -- New tab (⌘T)
      keystroke "t" using {command down}
      delay 0.15
    end if

    set t to item i of titles
    set c to item i of commands

    -- Set tab title via OSC 2, then run the command
    keystroke "printf '\\e]2;" & t & "\\a'; " & c
    key code 36 -- Return
    delay 0.2
  end repeat

  -- Optional: jump back to first tab (⌘1)
  tell application id "com.mitchellh.ghostty" to activate
  delay 0.05
  keystroke "1" using {command down}
end tell
APPLESCRIPT