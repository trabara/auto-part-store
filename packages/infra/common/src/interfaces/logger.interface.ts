/**
 * Logger Interface
 *
 * Defines the contract for logging services.
 * Following ISP: clients only depend on methods they use.
 */
export interface ILogger {
  info(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;
}
