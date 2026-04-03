import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ILogger } from "../interfaces/logger.interface";

/**
 * Console Logger Implementation
 *
 * Simple logger that outputs to console with structured formatting.
 * Following SRP: Single responsibility is logging to console.
 * Following OCP: Can be extended or replaced without modifying consumers.
 */
export class ConsoleLogger implements ILogger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, contextData?: Record<string, any>): void {
    console.log(`[${this.context}] INFO: ${message}`, contextData || "");
  }

  error(
    message: string,
    error?: Error,
    contextData?: Record<string, any>,
  ): void {
    console.error(
      `[${this.context}] ERROR: ${message}`,
      error?.message || "",
      contextData || "",
    );
  }

  warn(message: string, contextData?: Record<string, any>): void {
    console.warn(`[${this.context}] WARN: ${message}`, contextData || "");
  }

  debug(message: string, contextData?: Record<string, any>): void {
    console.debug(`[${this.context}] DEBUG: ${message}`, contextData || "");
  }
}

/**
 * Medusa Logger Adapter
 *
 * Adapts Medusa's built-in logger to our ILogger interface.
 * Following Adapter Pattern and DIP: Depend on abstractions, not concretions.
 */
export class MedusaLoggerAdapter implements ILogger {
  private logger: any;
  private context: string;

  constructor(medusaLogger: any, context: string) {
    this.logger = medusaLogger;
    this.context = context;
  }

  info(message: string, contextData?: Record<string, any>): void {
    this.logger.info(`[${this.context}] ${message}`, contextData);
  }

  error(
    message: string,
    error?: Error,
    contextData?: Record<string, any>,
  ): void {
    this.logger.error(`[${this.context}] ${message}`, {
      error: error?.message,
      stack: error?.stack,
      ...contextData,
    });
  }

  warn(message: string, contextData?: Record<string, any>): void {
    this.logger.warn(`[${this.context}] ${message}`, contextData);
  }

  debug(message: string, contextData?: Record<string, any>): void {
    this.logger.debug(`[${this.context}] ${message}`, contextData);
  }

  /**
   * Factory method to create logger from Medusa request scope
   */
  static fromScope(scope: any, context: string): ILogger {
    try {
      const medusaLogger = scope.resolve(ContainerRegistrationKeys.LOGGER);
      return new MedusaLoggerAdapter(medusaLogger, context);
    } catch (error) {
      // Fallback to console logger if Medusa logger is not available
      return new ConsoleLogger(context);
    }
  }
}
