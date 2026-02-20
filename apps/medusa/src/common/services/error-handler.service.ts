import { IErrorHandler } from "../interfaces/error-handler.interface";
import { ILogger } from "../interfaces/logger.interface";

/**
 * API Error Handler
 *
 * Centralized error handling for API routes.
 * Following SRP: Single responsibility is to handle and format errors.
 * Following OCP: Easy to extend with new error types.
 */
export class ApiErrorHandler implements IErrorHandler {
  constructor(private logger: ILogger) {}

  handle(
    error: Error,
    context?: Record<string, any>,
  ): { statusCode: number; message: string; error?: string } {
    // Log the error with context
    this.logger.error(error.message, error, context);

    // Handle specific error types
    if (this.isNotFoundError(error)) {
      return {
        statusCode: 404,
        message: this.extractNotFoundMessage(error),
      };
    }

    if (this.isValidationError(error)) {
      return {
        statusCode: 400,
        message: "Validation error",
        error: error.message,
      };
    }

    if (this.isAuthenticationError(error)) {
      return {
        statusCode: 401,
        message: "Unauthorized",
      };
    }

    if (this.isAuthorizationError(error)) {
      return {
        statusCode: 403,
        message: "Forbidden",
      };
    }

    // Default to 500 for unknown errors
    return {
      statusCode: 500,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    };
  }

  private isNotFoundError(error: Error): boolean {
    return (
      error.message?.includes("not found") ||
      (error as any).type === "not_found" ||
      error.name === "NotFoundError"
    );
  }

  private extractNotFoundMessage(error: Error): string {
    // Extract entity name from error message if possible
    const match = error.message?.match(/(\w+) not found/i);
    return match ? `${match[1]} not found` : "Resource not found";
  }

  private isValidationError(error: Error): boolean {
    return (
      error.name === "ValidationError" ||
      (error as any).type === "validation_error" ||
      error.message?.includes("validation")
    );
  }

  private isAuthenticationError(error: Error): boolean {
    return (
      error.name === "AuthenticationError" ||
      (error as any).type === "authentication_error" ||
      error.message?.includes("authentication")
    );
  }

  private isAuthorizationError(error: Error): boolean {
    return (
      error.name === "AuthorizationError" ||
      (error as any).type === "authorization_error" ||
      error.message?.includes("authorization") ||
      error.message?.includes("forbidden")
    );
  }
}
