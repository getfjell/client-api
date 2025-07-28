/**
 * Base class for all Client API errors
 */
export abstract class ClientApiError extends Error {
  abstract readonly code: string;
  abstract readonly isRetryable: boolean;
  readonly timestamp: Date;
  readonly context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      isRetryable: this.isRetryable,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Network-related errors (connection issues, timeouts)
 */
export class NetworkError extends ClientApiError {
  readonly code = 'NETWORK_ERROR';
  readonly isRetryable = true;

  constructor(message: string, context?: Record<string, any>) {
    super(`Network error: ${message}`, context);
  }
}

/**
 * HTTP timeout errors
 */
export class TimeoutError extends ClientApiError {
  readonly code = 'TIMEOUT_ERROR';
  readonly isRetryable = true;

  constructor(timeout: number, context?: Record<string, any>) {
    super(`Request timed out after ${timeout}ms`, context);
  }
}

/**
 * Authentication errors (401 Unauthorized)
 */
export class AuthenticationError extends ClientApiError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly isRetryable = false;

  constructor(message?: string, context?: Record<string, any>) {
    super(message || 'Authentication failed - invalid or expired credentials', context);
  }
}

/**
 * Authorization errors (403 Forbidden)
 */
export class AuthorizationError extends ClientApiError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly isRetryable = false;

  constructor(message?: string, context?: Record<string, any>) {
    super(message || 'Access forbidden - insufficient permissions', context);
  }
}

/**
 * Resource not found errors (404 Not Found)
 */
export class NotFoundError extends ClientApiError {
  readonly code = 'NOT_FOUND_ERROR';
  readonly isRetryable = false;

  constructor(resource: string, identifier?: string, context?: Record<string, any>) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, context);
  }
}

/**
 * Request validation errors (400 Bad Request)
 */
export class ValidationError extends ClientApiError {
  readonly code = 'VALIDATION_ERROR';
  readonly isRetryable = false;
  readonly validationErrors?: Array<{ field: string; message: string }>;

  constructor(message: string, validationErrors?: Array<{ field: string; message: string }>, context?: Record<string, any>) {
    super(`Validation error: ${message}`, context);
    this.validationErrors = validationErrors;
  }
}

/**
 * Conflict errors (409 Conflict)
 */
export class ConflictError extends ClientApiError {
  readonly code = 'CONFLICT_ERROR';
  readonly isRetryable = false;

  constructor(message: string, context?: Record<string, any>) {
    super(`Conflict: ${message}`, context);
  }
}

/**
 * Rate limiting errors (429 Too Many Requests)
 */
export class RateLimitError extends ClientApiError {
  readonly code = 'RATE_LIMIT_ERROR';
  readonly isRetryable = true;
  readonly retryAfter?: number;

  constructor(retryAfter?: number, context?: Record<string, any>) {
    const message = retryAfter
      ? `Rate limit exceeded - retry after ${retryAfter} seconds`
      : 'Rate limit exceeded';
    super(message, context);
    this.retryAfter = retryAfter;
  }
}

/**
 * Server errors (5xx status codes)
 */
export class ServerError extends ClientApiError {
  readonly code = 'SERVER_ERROR';
  readonly isRetryable = true;
  readonly statusCode: number;

  constructor(statusCode: number, message?: string, context?: Record<string, any>) {
    super(message || `Server error (${statusCode})`, context);
    this.statusCode = statusCode;
  }
}

/**
 * Request payload too large errors (413)
 */
export class PayloadTooLargeError extends ClientApiError {
  readonly code = 'PAYLOAD_TOO_LARGE_ERROR';
  readonly isRetryable = false;

  constructor(maxSize?: string, context?: Record<string, any>) {
    const message = maxSize
      ? `Request payload too large - maximum size is ${maxSize}`
      : 'Request payload too large';
    super(message, context);
  }
}

/**
 * Generic HTTP errors for unhandled status codes
 */
export class HttpError extends ClientApiError {
  readonly code = 'HTTP_ERROR';
  readonly isRetryable: boolean;
  readonly statusCode: number;
  readonly statusText: string;

  constructor(statusCode: number, statusText: string, message?: string, context?: Record<string, any>) {
    super(message || `HTTP error ${statusCode}: ${statusText}`, context);
    this.statusCode = statusCode;
    this.statusText = statusText;

    // 5xx errors are generally retryable, 4xx are not
    this.isRetryable = statusCode >= 500;
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends ClientApiError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly isRetryable = false;

  constructor(message: string, context?: Record<string, any>) {
    super(`Configuration error: ${message}`, context);
  }
}

/**
 * Parse/serialization errors
 */
export class ParseError extends ClientApiError {
  readonly code = 'PARSE_ERROR';
  readonly isRetryable = false;

  constructor(message: string, context?: Record<string, any>) {
    super(`Parse error: ${message}`, context);
  }
}

/**
 * Create appropriate error from HTTP response
 */
export function createHttpError(
  statusCode: number,
  statusText: string,
  responseBody?: any,
  context?: Record<string, any>
): ClientApiError {
  const errorContext = { statusCode, statusText, responseBody, ...context };

  switch (statusCode) {
    case 400:
      if (responseBody?.validationErrors) {
        return new ValidationError(
          responseBody.message || 'Request validation failed',
          responseBody.validationErrors,
          errorContext
        );
      }
      return new ValidationError(responseBody?.message || statusText, [], errorContext);

    case 401:
      return new AuthenticationError(responseBody?.message, errorContext);

    case 403:
      return new AuthorizationError(responseBody?.message, errorContext);

    case 404:
      return new NotFoundError(
        responseBody?.resource || 'Resource',
        responseBody?.identifier,
        errorContext
      );

    case 409:
      return new ConflictError(responseBody?.message || statusText, errorContext);

    case 413:
      return new PayloadTooLargeError(responseBody?.maxSize, errorContext);

    case 429: {
      let retryAfter: number | undefined;
      if (responseBody?.retryAfter) {
        retryAfter = responseBody.retryAfter;
      } else if (context?.headers?.['retry-after']) {
        retryAfter = parseInt(context.headers['retry-after']);
      }
      return new RateLimitError(retryAfter, errorContext);
    }

    default:
      if (statusCode >= 500) {
        return new ServerError(statusCode, responseBody?.message || statusText, errorContext);
      }

      return new HttpError(statusCode, statusText, responseBody?.message, errorContext);
  }
}

/**
 * Create appropriate error from network/connection issues
 */
export function createNetworkError(error: any, context?: Record<string, any>): ClientApiError {
  const errorContext = { originalError: error, ...context };

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return new TimeoutError(error.timeout || 5000, errorContext);
  }

  if (error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ENETUNREACH' ||
    error.message?.includes('network')) {
    return new NetworkError(error.message || 'Network connection failed', errorContext);
  }

  // For unknown errors, treat as network issues that might be retryable
  return new NetworkError(error.message || 'Unknown network error', errorContext);
}

/**
 * Type guard to check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  return error instanceof ClientApiError && error.isRetryable;
}

/**
 * Type guard to check if error is a Client API error
 */
export function isClientApiError(error: any): error is ClientApiError {
  return error instanceof ClientApiError;
}
