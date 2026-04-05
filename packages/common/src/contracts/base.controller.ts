import {
  MedusaRequest,
  MedusaResponse
} from "@medusajs/framework/http";
import { IErrorHandler } from "../interfaces/error-handler.interface";
import { ILogger } from "../interfaces/logger.interface";
import { ApiErrorHandler } from "./error-handler.service";
import { MedusaLoggerAdapter } from "./logger.service";

/**
 * Base Controller
 *
 * Provides common functionality for all API controllers.
 * Following SRP: Separates HTTP concerns from business logic.
 * Following DIP: Depends on abstractions (ILogger, IErrorHandler).
 * Following Template Method Pattern: Defines common flow, delegates specifics to subclasses.
 */
export abstract class BaseController {
  protected logger: ILogger;
  protected errorHandler: IErrorHandler;

  constructor(
    protected readonly req: MedusaRequest,
    protected readonly res: MedusaResponse,
  ) {
    this.logger = MedusaLoggerAdapter.fromScope(
      req.scope,
      this.constructor.name,
    );
    this.errorHandler = new ApiErrorHandler(this.logger);
  }

  /**
   * Execute a controller action with automatic error handling
   */
  protected async execute<T>(
    action: () => Promise<T>,
    successMessage?: string,
  ): Promise<void> {
    try {
      const result = await action();

      if (successMessage) {
        this.logger.info(successMessage);
      }

      // Response is handled by the action itself
      // This allows flexibility in response format
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Handle errors consistently across all controllers
   */
  protected handleError(error: Error, context?: Record<string, any>): void {
    const errorResponse = this.errorHandler.handle(error, {
      ...context,
      method: this.req.method,
      path: this.req.url,
      params: this.req.params,
    });

    this.res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      ...(errorResponse.error && { error: errorResponse.error }),
    });
  }

  /**
   * Send success response
   */
  protected success<T>(data: T, statusCode: number = 200): void {
    this.res.status(statusCode).json(data);
  }

  /**
   * Send created response
   */
  protected created<T>(data: T): void {
    this.success(data, 201);
  }

  /**
   * Send no content response
   */
  protected noContent(): void {
    this.res.status(204).send();
  }

  /**
   * Send not found response
   */
  protected notFound(message: string = "Resource not found"): void {
    this.res.status(404).json({ message });
  }

  /**
   * Send bad request response
   */
  protected badRequest(message: string = "Bad request"): void {
    this.res.status(400).json({ message });
  }

  /**
   * Send unauthorized response
   */
  protected unauthorized(message: string = "Unauthorized"): void {
    this.res.status(401).json({ message });
  }

  /**
   * Send forbidden response
   */
  protected forbidden(message: string = "Forbidden"): void {
    this.res.status(403).json({ message });
  }

  /**
   * Send internal server error response
   */
  protected internalServerError(
    message: string = "Internal server error",
  ): void {
    this.res.status(500).json({ message });
  }
}
