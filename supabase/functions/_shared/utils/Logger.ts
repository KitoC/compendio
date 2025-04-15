// NO_CHANGE
import { ProviderError } from "locals/error-types";
import { getEnvKey } from "locals/utils/env";
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
  private name: string;
  constructor({ name = "default" }: { name?: string }) {
    this.currentLogLevel = parseInt(getEnvKey("LOG_LEVEL") || "2") as LogLevel;
    this.name = name;
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
    const levelString = level;
    const nameString = this.name || "unknown";

    const formattedMessage = `[${timestamp}] [${levelString} in ${nameString}] ${message}`;

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
      const errorMessage = this.formatLogMessage("❗ERROR", message, error);
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
      console.info(this.formatLogMessage("⚠️ WARN", message, data));
    }
  }

  // Info logs
  info(message: string, data?: unknown): void {
    if (this.currentLogLevel >= LogLevel.INFO) {
      console.log(this.formatLogMessage("ℹ️ INFO", message, data));
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
        this.formatLogMessage("🔶 DEBUG", message),
        JSON.stringify(data, null, 2)
      );
    }
  }

  throwAndLog(error?: Error, message?: string): void {
    this.error(
      JSON.stringify(
        error?.message || message || "An unknown error occurred",
        null,
        2
      ),
      error
    );

    throw error;
  }

  throwProviderError(
    name: string,
    message: string,
    errorOrStatus: object | number,
    status: number = 401
  ) {
    if (typeof errorOrStatus === "object") {
      this.throwAndLog(new ProviderError(name, message, status, errorOrStatus));
    } else {
      this.throwAndLog(new ProviderError(name, message, errorOrStatus));
    }
  }
}

export default Logger;
