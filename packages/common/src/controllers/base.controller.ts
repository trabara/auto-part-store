import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ILogger } from "../interfaces/logger.interface";
import { IErrorHandler } from "../interfaces/error-handler.interface";
import { MedusaLoggerAdapter } from "../services/logger.service";
import { ApiErrorHandler } from "../services/error-handler.service";

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
    protected readonly res: MedusaResponse
  ) {
    this.logger = MedusaLoggerAdapter.fromScope(req.scope, this.constructor.name);
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
}
