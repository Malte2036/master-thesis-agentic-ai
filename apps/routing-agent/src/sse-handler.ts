import { Logger } from '@master-thesis-agentic-ai/agent-framework';
import express from 'express';

// Store active SSE connections
const activeConnections = new Map<string, express.Response>();

export interface SSESetupOptions {
  logger: Logger;
  app: express.Application;
}

/**
 * Sets up the SSE endpoint for streaming updates
 */
export function setupSSEEndpoint({ logger, app }: SSESetupOptions): void {
  app.get('/stream/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    logger.log('Client connected to SSE endpoint for session:', sessionId);

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    res.write(
      'data: {"type":"connected","data":"Connected to SSE stream"}\n\n',
    );

    // Store the connection
    activeConnections.set(sessionId, res);

    // Set up keep-alive ping
    const keepAliveInterval = setInterval(() => {
      if (activeConnections.has(sessionId)) {
        try {
          res.write(': ping\n\n');
        } catch {
          logger.debug('Keep-alive ping failed, connection may be closed');
          clearInterval(keepAliveInterval);
          activeConnections.delete(sessionId);
        }
      } else {
        clearInterval(keepAliveInterval);
      }
    }, 30000); // Send ping every 30 seconds

    // Remove connection when client disconnects
    req.on('close', () => {
      logger.log('Client disconnected from SSE stream');
      clearInterval(keepAliveInterval);
      activeConnections.delete(sessionId);
    });

    // Handle errors
    req.on('error', (error) => {
      logger.error('SSE connection error:', error);
      clearInterval(keepAliveInterval);
      activeConnections.delete(sessionId);
    });

    // Handle aborted requests
    req.on('aborted', () => {
      logger.log('SSE connection aborted');
      clearInterval(keepAliveInterval);
      activeConnections.delete(sessionId);
    });
  });
}

/**
 * Helper function to send SSE updates to a specific session
 */
export function sendSSEUpdate(
  logger: Logger,
  sessionId: string,
  data: unknown,
): void {
  logger.debug('Sending SSE update:', data);
  const connection = activeConnections.get(sessionId);
  if (connection) {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      connection.write(message);
      logger.debug('SSE update sent successfully');
    } catch (error) {
      logger.error('Error sending SSE update:', error);
      // Check if connection is still writable
      if (connection.destroyed || connection.writableEnded) {
        logger.log('Connection is closed, removing from active connections');
        activeConnections.delete(sessionId);
      }
    }
  } else {
    logger.debug('No active connection found for session:', sessionId);
  }
}

/**
 * Cleanup SSE connection for a session after a delay
 */
export function cleanupConnection(
  logger: Logger,
  sessionId: string,
  delayMs = 5000,
): void {
  setTimeout(() => {
    if (activeConnections.has(sessionId)) {
      logger.log('Cleaning up SSE connection for session:', sessionId);
      activeConnections.delete(sessionId);
    }
  }, delayMs);
}
