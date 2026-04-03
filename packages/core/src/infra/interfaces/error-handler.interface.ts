/**
 * Error Handler Interface
 *
 * Defines the contract for error handling services.
 * Following ISP: focused interface for error handling only.
 */
export interface IErrorHandler {
  handle(
    error: Error,
    context?: Record<string, any>,
  ): {
    statusCode: number;
    message: string;
    error?: string;
  };
}
