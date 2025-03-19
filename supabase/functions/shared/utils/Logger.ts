// NO_CHANGE

/**
 * Logger utility for consistent logging across the application
 * Provides different log levels and formatting for better debugging
 */

// Log levels for controlling output verbosity
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  STATS = 3,
  DEBUG = 4,
}

class Logger {
  private currentLogLevel: LogLevel;

  constructor({
    debug,
    level = LogLevel.INFO,
  }: {
    debug: boolean;
    level?: LogLevel;
  }) {
    console.log("debug", debug);
    this.currentLogLevel = debug ? LogLevel.DEBUG : level;
  }

  // Helper to format date consistently
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  // Helper to format log messages
  private formatLogMessage(
    level: string,
    message: string,
    data?: unknown
  ): string {
    const timestamp = this.getTimestamp();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;

    if (data) {
      return `${formattedMessage} ${
        typeof data === "object" ? JSON.stringify(data) : data
      }`;
    }

    return formattedMessage;
  }

  // Set the current log level
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  // Base log function
  log(message: string, data?: unknown): void {
    console.log(message, data);
  }

  // Error logs - always shown
  error(message: string, error?: Error): void {
    if (this.currentLogLevel >= LogLevel.ERROR) {
      const errorMessage = this.formatLogMessage("ERROR", message, error);
      console.error(errorMessage);

      // Log stack trace if available
      if (error && error.stack) {
        console.error(error.stack);
      }
    }
  }

  // Warning logs
  warn(message: string, data?: unknown): void {
    if (this.currentLogLevel >= LogLevel.WARN) {
      console.warn(this.formatLogMessage("WARN", message, data));
    }
  }

  // Info logs
  info(message: string, data?: unknown): void {
    if (this.currentLogLevel >= LogLevel.INFO) {
      console.log(this.formatLogMessage("INFO", message, data));
    }
  }

  // Stats logs - for performance metrics, etc.
  stats(message: string, data?: unknown): void {
    if (this.currentLogLevel >= LogLevel.STATS) {
      console.log(this.formatLogMessage("STATS", message, data));
    }
  }

  // Debug logs - most verbose
  debug(message: string, data?: unknown): void {
    if (this.currentLogLevel >= LogLevel.DEBUG) {
      console.log(
        this.formatLogMessage("DEBUG", message, JSON.stringify(data, null, 2))
      );
    }
  }
}

export default Logger;
