import { describe, expect, it } from 'vitest';
import {
  AuthenticationError,
  AuthorizationError,
  ClientApiError,
  ConfigurationError,
  ConflictError,
  createHttpError,
  createNetworkError,
  HttpError,
  isClientApiError,
  isRetryableError,
  NetworkError,
  NotFoundError,
  ParseError,
  PayloadTooLargeError,
  RateLimitError,
  ServerError,
  TimeoutError,
  ValidationError
} from '../../src/errors/index.js';

describe('Client API Errors', () => {
  describe('NetworkError', () => {
    it('should create network error with correct properties', () => {
      const error = new NetworkError('Connection failed');

      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toBe('Network error: Connection failed');
      expect(error.isRetryable).toBe(true);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should include context when provided', () => {
      const context = { host: 'example.com', port: 443 };
      const error = new NetworkError('Connection failed', context);

      expect(error.context).toEqual(context);
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error with timeout duration', () => {
      const error = new TimeoutError(5000);

      expect(error.name).toBe('TimeoutError');
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.message).toBe('Request timed out after 5000ms');
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with default message', () => {
      const error = new AuthenticationError();

      expect(error.name).toBe('AuthenticationError');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.message).toBe('Authentication failed - invalid or expired credentials');
      expect(error.isRetryable).toBe(false);
    });

    it('should use custom message when provided', () => {
      const error = new AuthenticationError('Invalid token');

      expect(error.message).toBe('Invalid token');
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error with default message', () => {
      const error = new AuthorizationError();

      expect(error.name).toBe('AuthorizationError');
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.message).toBe('Access forbidden - insufficient permissions');
      expect(error.isRetryable).toBe(false);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with resource only', () => {
      const error = new NotFoundError('User');

      expect(error.name).toBe('NotFoundError');
      expect(error.code).toBe('NOT_FOUND_ERROR');
      expect(error.message).toBe('User not found');
      expect(error.isRetryable).toBe(false);
    });

    it('should create not found error with resource and identifier', () => {
      const error = new NotFoundError('User', '123');

      expect(error.message).toBe('User with identifier \'123\' not found');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with message', () => {
      const error = new ValidationError('Invalid input');

      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Validation error: Invalid input');
      expect(error.isRetryable).toBe(false);
    });

    it('should include validation errors when provided', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'age', message: 'Must be a positive number' }
      ];
      const error = new ValidationError('Multiple validation errors', validationErrors);

      expect(error.validationErrors).toEqual(validationErrors);
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.name).toBe('ConflictError');
      expect(error.code).toBe('CONFLICT_ERROR');
      expect(error.message).toBe('Conflict: Resource already exists');
      expect(error.isRetryable).toBe(false);
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error without retry after', () => {
      const error = new RateLimitError();

      expect(error.name).toBe('RateLimitError');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.isRetryable).toBe(true);
    });

    it('should create rate limit error with retry after', () => {
      const error = new RateLimitError(60);

      expect(error.message).toBe('Rate limit exceeded - retry after 60 seconds');
      expect(error.retryAfter).toBe(60);
    });
  });

  describe('ServerError', () => {
    it('should create server error with status code', () => {
      const error = new ServerError(500);

      expect(error.name).toBe('ServerError');
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.message).toBe('Server error (500)');
      expect(error.statusCode).toBe(500);
      expect(error.isRetryable).toBe(true);
    });

    it('should use custom message when provided', () => {
      const error = new ServerError(503, 'Service unavailable');

      expect(error.message).toBe('Service unavailable');
      expect(error.statusCode).toBe(503);
    });
  });

  describe('PayloadTooLargeError', () => {
    it('should create payload error without max size', () => {
      const error = new PayloadTooLargeError();

      expect(error.name).toBe('PayloadTooLargeError');
      expect(error.code).toBe('PAYLOAD_TOO_LARGE_ERROR');
      expect(error.message).toBe('Request payload too large');
      expect(error.isRetryable).toBe(false);
    });

    it('should include max size when provided', () => {
      const error = new PayloadTooLargeError('10MB');

      expect(error.message).toBe('Request payload too large - maximum size is 10MB');
    });
  });

  describe('HttpError', () => {
    it('should create HTTP error for 4xx status codes', () => {
      const error = new HttpError(418, 'I\'m a teapot');

      expect(error.name).toBe('HttpError');
      expect(error.code).toBe('HTTP_ERROR');
      expect(error.statusCode).toBe(418);
      expect(error.statusText).toBe('I\'m a teapot');
      expect(error.isRetryable).toBe(false);
    });

    it('should create HTTP error for 5xx status codes', () => {
      const error = new HttpError(502, 'Bad Gateway');

      expect(error.statusCode).toBe(502);
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError('Invalid API key');

      expect(error.name).toBe('ConfigurationError');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.message).toBe('Configuration error: Invalid API key');
      expect(error.isRetryable).toBe(false);
    });
  });

  describe('ParseError', () => {
    it('should create parse error', () => {
      const error = new ParseError('Invalid JSON response');

      expect(error.name).toBe('ParseError');
      expect(error.code).toBe('PARSE_ERROR');
      expect(error.message).toBe('Parse error: Invalid JSON response');
      expect(error.isRetryable).toBe(false);
    });
  });

  describe('JSON serialization', () => {
    it('should serialize error to JSON', () => {
      const context = { userId: '123' };
      const error = new ValidationError('Test error', [], context);
      const json = error.toJSON();

      expect(json.name).toBe('ValidationError');
      expect(json.code).toBe('VALIDATION_ERROR');
      expect(json.message).toBe('Validation error: Test error');
      expect(json.isRetryable).toBe(false);
      expect(json.timestamp).toBeInstanceOf(Date);
      expect(json.context).toEqual(context);
      expect(json.stack).toBeDefined();
    });
  });

  describe('createHttpError', () => {
    it('should create ValidationError for 400 status', () => {
      const error = createHttpError(400, 'Bad Request');

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should create ValidationError with validation details', () => {
      const responseBody = {
        message: 'Validation failed',
        validationErrors: [{ field: 'email', message: 'Required' }]
      };
      const error = createHttpError(400, 'Bad Request', responseBody);

      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).validationErrors).toEqual(responseBody.validationErrors);
    });

    it('should create AuthenticationError for 401 status', () => {
      const error = createHttpError(401, 'Unauthorized');

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should create AuthorizationError for 403 status', () => {
      const error = createHttpError(403, 'Forbidden');

      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should create NotFoundError for 404 status', () => {
      const error = createHttpError(404, 'Not Found');

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.code).toBe('NOT_FOUND_ERROR');
    });

    it('should create ConflictError for 409 status', () => {
      const error = createHttpError(409, 'Conflict');

      expect(error).toBeInstanceOf(ConflictError);
      expect(error.code).toBe('CONFLICT_ERROR');
    });

    it('should create PayloadTooLargeError for 413 status', () => {
      const error = createHttpError(413, 'Payload Too Large');

      expect(error).toBeInstanceOf(PayloadTooLargeError);
      expect(error.code).toBe('PAYLOAD_TOO_LARGE_ERROR');
    });

    it('should create RateLimitError for 429 status', () => {
      const error = createHttpError(429, 'Too Many Requests');

      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.code).toBe('RATE_LIMIT_ERROR');
    });

    it('should create RateLimitError with retry after from headers', () => {
      const context = { headers: { 'retry-after': '120' } };
      const error = createHttpError(429, 'Too Many Requests', null, context);

      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).retryAfter).toBe(120);
    });

    it('should create ServerError for 5xx status codes', () => {
      const error = createHttpError(500, 'Internal Server Error');

      expect(error).toBeInstanceOf(ServerError);
      expect(error.code).toBe('SERVER_ERROR');
      expect((error as ServerError).statusCode).toBe(500);
    });

    it('should create HttpError for unhandled 4xx status codes', () => {
      const error = createHttpError(418, 'I\'m a teapot');

      expect(error).toBeInstanceOf(HttpError);
      expect(error.code).toBe('HTTP_ERROR');
      expect((error as HttpError).statusCode).toBe(418);
    });
  });

  describe('createNetworkError', () => {
    it('should create TimeoutError for timeout errors', () => {
      const originalError = { code: 'ECONNABORTED', timeout: 3000 };
      const error = createNetworkError(originalError);

      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.code).toBe('TIMEOUT_ERROR');
    });

    it('should create TimeoutError for timeout messages', () => {
      const originalError = { message: 'Request timeout occurred' };
      const error = createNetworkError(originalError);

      expect(error).toBeInstanceOf(TimeoutError);
    });

    it('should create NetworkError for connection refused', () => {
      const originalError = { code: 'ECONNREFUSED', message: 'Connection refused' };
      const error = createNetworkError(originalError);

      expect(error).toBeInstanceOf(NetworkError);
      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('should create NetworkError for host not found', () => {
      const originalError = { code: 'ENOTFOUND', message: 'Host not found' };
      const error = createNetworkError(originalError);

      expect(error).toBeInstanceOf(NetworkError);
    });

    it('should create NetworkError for network unreachable', () => {
      const originalError = { code: 'ENETUNREACH', message: 'Network unreachable' };
      const error = createNetworkError(originalError);

      expect(error).toBeInstanceOf(NetworkError);
    });

    it('should create NetworkError for unknown errors', () => {
      const originalError = { message: 'Unknown error occurred' };
      const error = createNetworkError(originalError);

      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Network error: Unknown error occurred');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      const error = new NetworkError('Connection failed');

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error = new AuthenticationError();

      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for non-ClientApiError instances', () => {
      const error = new Error('Generic error');

      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('isClientApiError', () => {
    it('should return true for ClientApiError instances', () => {
      const error = new ValidationError('Test error');

      expect(isClientApiError(error)).toBe(true);
    });

    it('should return false for non-ClientApiError instances', () => {
      const error = new Error('Generic error');

      expect(isClientApiError(error)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isClientApiError(null)).toBe(false);
      expect(isClientApiError(void 0)).toBe(false);
    });
  });

  describe('instanceof checks', () => {
    it('should properly support instanceof checks', () => {
      const networkError = new NetworkError('Connection failed');
      const authError = new AuthenticationError();

      expect(networkError instanceof ClientApiError).toBe(true);
      expect(networkError instanceof NetworkError).toBe(true);
      expect(authError instanceof ClientApiError).toBe(true);
      expect(authError instanceof AuthenticationError).toBe(true);
      expect(networkError instanceof AuthenticationError).toBe(false);
    });
  });
});
