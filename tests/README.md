# E2E Testing Setup

## 🚀 Quick Start

1. **Start services:**

   ```bash
   bash ./scripts/start-local-split.sh --no-ui
   ```

2. **Run tests:**
   ```bash
   pnpm test:e2e
   ```

## 🧪 Test Flow

The E2E test validates the complete ReAct reasoning flow:

1. **User Request** → POST `/ask` with prompt
2. **Routing Agent** → Analyzes prompt, decides which agent to call
3. **Moodle Agent** → Processes the request
4. **Routing Agent** → Generates final response
5. **SSE Stream** → Emits final response to client
6. **Validation** → Verifies response content

## 🛠️ Utility Functions

### RoutingAgentClient

```typescript
import { RoutingAgentClient } from './utils/routing-agent-client';

const client = new RoutingAgentClient('http://localhost:3000');
await client.waitForReady();

const response = await client.askAndWaitForResponse({
  prompt: 'What are my assignments?',
  model: 'mixtral:8x7b',
});
```

## 🔧 Configuration

- **Routing Agent**: `http://localhost:3000`
- **Moodle Agent**: `http://localhost:1234`

## 🐛 Troubleshooting

```bash
# Test routing agent health
curl http://localhost:3000/test

# Test moodle agent
curl http://localhost:1234/.well-known/agent.json
```
