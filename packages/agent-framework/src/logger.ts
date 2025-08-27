/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

// Global session timestamp - shared across all agents in the same process
let globalSessionTimestamp: string | null = null;

function getOrCreateSessionTimestamp(): string {
  if (!globalSessionTimestamp) {
    // First check if there's an environment variable set by the dev script
    if (process.env['AGENT_SESSION_TIMESTAMP']) {
      globalSessionTimestamp = process.env['AGENT_SESSION_TIMESTAMP'];
    } else {
      // Create new timestamp with readable format
      const now = new Date();
      const date = now.toISOString().split('T')[0]; // 2025-06-09
      const time = now
        .toISOString()
        .split('T')[1]
        .split('.')[0]
        .replace(/:/g, '-'); // 14-30-45
      globalSessionTimestamp = `${date}_${time}`; // 2025-06-09_14-30-45

      if (process.env['NODE_ENV'] === 'test') {
        globalSessionTimestamp = `test_${globalSessionTimestamp}`;
      }
    }
  }
  return globalSessionTimestamp;
}

interface LoggerConfig {
  logsDir?: string;
  logsSubDir?: string;
  agentName?: string;
  hideDebugInConsole?: boolean;
}

// Helper function to truncate and clean strings for file paths
function sanitizeForPath(str: string, maxLength = 100): string {
  // Replace problematic characters with a hyphen
  const cleaned = str.replace(/[:/\\?#%*|"<>]/g, '-');
  // Truncate if the string is too long
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) : cleaned;
}

class Logger {
  private logFilePath: string;
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
    debug: typeof console.debug;
    trace: typeof console.trace;
    table: typeof console.table;
  };
  constructor(private config: LoggerConfig = {}) {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
      trace: console.trace,
      table: console.table,
    };

    this.logFilePath = this.setupLogFile();
  }

  private setupLogFile(): string {
    const baseLogsDir = this.config.logsDir || path.join(process.cwd(), 'logs');

    // Use shared session timestamp across all agents
    const sessionTimestamp = getOrCreateSessionTimestamp();

    const sessionLogsDir = path.join(
      baseLogsDir,
      sessionTimestamp,
      sanitizeForPath(this.config.logsSubDir || ''),
    );

    // Create timestamped logs directory if it doesn't exist
    if (!fs.existsSync(sessionLogsDir)) {
      fs.mkdirSync(sessionLogsDir, { recursive: true });
    }

    // Create log file with agent name
    const agentName = this.config.agentName || 'agent-framework';
    const logFileName = `${sanitizeForPath(agentName)}.log`;

    return path.join(sessionLogsDir, logFileName);
  }

  private formatLogMessage(level: string, args: unknown[]): string {
    const timestamp = new Date().toISOString();
    // Create ANSI escape sequence regex to avoid linter warning
    const ansiRegex = new RegExp(String.fromCharCode(27) + '\[[0-9;]*m', 'g');
    const message = args
      .map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg),
      )
      .join(' ')
      // Strip ANSI color codes for clean log files
      .replace(ansiRegex, '');
    return `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  }

  private writeToLogFile(level: string, args: unknown[]) {
    try {
      const logMessage = this.formatLogMessage(level, args);
      fs.appendFileSync(this.logFilePath, logMessage);
    } catch (error) {
      // Fallback to original console if file writing fails
      this.originalConsole.error('Failed to write to log file:', error);
    }
  }

  public log(...args: unknown[]): void {
    this.writeToLogFile('log', args);
    this.originalConsole.log(...args);
  }

  public error(...args: unknown[]): void {
    this.writeToLogFile('error', args);
    this.originalConsole.error(...args);
  }

  public warn(...args: unknown[]): void {
    this.writeToLogFile('warn', args);
    this.originalConsole.warn(...args);
  }

  public info(...args: unknown[]): void {
    this.writeToLogFile('info', args);
    this.originalConsole.info(...args);
  }

  public debug(...args: unknown[]): void {
    this.writeToLogFile('debug', args);
    // Only show in console if hideDebugInConsole is false
    if (!this.config.hideDebugInConsole) {
      this.originalConsole.debug(...args);
    }
  }

  public table(...args: unknown[]): void {
    this.writeToLogFile('table', args);
    this.originalConsole.table(...args);
  }
}

// Export the Logger class for advanced usage
export { Logger };
export type { LoggerConfig };
