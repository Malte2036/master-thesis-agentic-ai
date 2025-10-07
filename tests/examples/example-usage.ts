import {
  RoutingAgentClient,
  askRoutingAgent,
} from '../utils/routing-agent-client';

/**
 * Example usage of the RoutingAgentClient utility
 */

async function exampleUsage() {
  console.log('🚀 Routing Agent Client Example');

  // Method 1: Using the client class
  const client = new RoutingAgentClient('http://localhost:3000');

  try {
    // Wait for the agent to be ready
    console.log('⏳ Waiting for routing agent to be ready...');
    await client.waitForReady();
    console.log('✅ Routing agent is ready!');

    // Check health
    const isHealthy = await client.healthCheck();
    console.log('🏥 Health check:', isHealthy ? '✅ Healthy' : '❌ Unhealthy');

    // Get available models
    const models = await client.getModels();
    console.log('🤖 Available models:', models);

    // Send a request and wait for response
    console.log('📤 Sending request...');
    const response = await client.askAndWaitForResponse({
      prompt: 'What are my upcoming assignments?',
      model: 'mixtral:8x7b',
    });

    console.log('📋 Final response:', response);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function simpleUsage() {
  console.log('🚀 Simple Usage Example');

  try {
    // Method 2: Using the convenience function
    const response = await askRoutingAgent('What courses am I enrolled in?');
    console.log('📋 Response:', response);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function asyncRequest() {
  console.log('🚀 Async Request Example');

  const client = new RoutingAgentClient('http://localhost:3000');

  try {
    // Send request without waiting for response
    const { id, status } = await client.ask({
      prompt: 'Create calendar events for my assignments',
    });

    console.log('📤 Request sent:', { id, status });
    console.log('💡 You can now listen to the SSE stream manually if needed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('Choose an example to run:');
  console.log('1. exampleUsage() - Full client usage');
  console.log('2. simpleUsage() - Simple convenience function');
  console.log('3. asyncRequest() - Async request without waiting');

  // Uncomment one of these to run:
  // exampleUsage();
  // simpleUsage();
  // asyncRequest();
}

export { exampleUsage, simpleUsage, asyncRequest };


