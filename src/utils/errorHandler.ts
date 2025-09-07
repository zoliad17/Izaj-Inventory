// Error handling utilities for the frontend
export interface ApiError {
    error: string;
    message?: string;
    details?: any;
    retryAfter?: number;
}

export interface ValidationError {
    field: string;
    error: string;
}

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: any;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true, details?: any) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Error types
export enum ErrorType {
    NETWORK_ERROR = 'NETWORK_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
    NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
    SERVER_ERROR = 'SERVER_ERROR',
    RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Error handler class
export class ErrorHandler {
    private static instance: ErrorHandler;
    private errorLog: Array<{ timestamp: Date; error: any; context?: any }> = [];

    private constructor() { }

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    // Categorize error based on response
    public categorizeError(error: any, response?: Response): ErrorType {
        if (!response) {
            return ErrorType.NETWORK_ERROR;
        }

        switch (response.status) {
            case 400:
                return ErrorType.VALIDATION_ERROR;
            case 401:
                return ErrorType.AUTHENTICATION_ERROR;
            case 403:
                return ErrorType.AUTHORIZATION_ERROR;
            case 404:
                return ErrorType.NOT_FOUND_ERROR;
            case 429:
                return ErrorType.RATE_LIMIT_ERROR;
            case 500:
            case 502:
            case 503:
            case 504:
                return ErrorType.SERVER_ERROR;
            default:
                return ErrorType.UNKNOWN_ERROR;
        }
    }

    // Get user-friendly error message
    public getErrorMessage(error: any, errorType: ErrorType): string {
        switch (errorType) {
            case ErrorType.NETWORK_ERROR:
                return 'Network connection failed. Please check your internet connection and try again.';

            case ErrorType.VALIDATION_ERROR:
                if (error.details && Array.isArray(error.details)) {
                    return `Validation failed: ${error.details.map((d: ValidationError) => d.error).join(', ')}`;
                }
                return error.message || 'Invalid input data. Please check your entries and try again.';

            case ErrorType.AUTHENTICATION_ERROR:
                return 'Authentication failed. Please log in again.';

            case ErrorType.AUTHORIZATION_ERROR:
                return 'You do not have permission to perform this action.';

            case ErrorType.NOT_FOUND_ERROR:
                return 'The requested resource was not found.';

            case ErrorType.RATE_LIMIT_ERROR:
                const retryAfter = error.retryAfter || 60;
                return `Too many requests. Please try again in ${retryAfter} seconds.`;

            case ErrorType.SERVER_ERROR:
                return 'Server error occurred. Please try again later.';

            default:
                return error.message || 'An unexpected error occurred. Please try again.';
        }
    }

    // Handle API errors
    public async handleApiError(response: Response): Promise<ApiError> {
        try {
            const errorData = await response.json();
            return {
                error: errorData.error || 'Unknown error',
                message: errorData.message,
                details: errorData.details,
                retryAfter: errorData.retryAfter
            };
        } catch {
            return {
                error: 'Failed to parse error response',
                message: `HTTP ${response.status}: ${response.statusText}`
            };
        }
    }

    // Log error for debugging
    public logError(error: any, context?: any): void {
        const errorEntry = {
            timestamp: new Date(),
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context
        };

        this.errorLog.push(errorEntry);

        // Keep only last 100 errors to prevent memory issues
        if (this.errorLog.length > 100) {
            this.errorLog = this.errorLog.slice(-100);
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error logged:', errorEntry);
        }
    }

    // Get error log for debugging
    public getErrorLog(): Array<{ timestamp: Date; error: any; context?: any }> {
        return [...this.errorLog];
    }

    // Clear error log
    public clearErrorLog(): void {
        this.errorLog = [];
    }

    // Handle fetch errors with retry logic
    public async fetchWithRetry(
        url: string,
        options: RequestInit = {},
        maxRetries: number = 3,
        retryDelay: number = 1000
    ): Promise<Response> {
        let lastError: any;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(url, options);

                // If response is ok, return it
                if (response.ok) {
                    return response;
                }

                // If it's a client error (4xx), don't retry
                if (response.status >= 400 && response.status < 500) {
                    return response;
                }

                // If it's a server error (5xx), retry
                if (response.status >= 500) {
                    lastError = new Error(`Server error: ${response.status}`);
                    if (attempt < maxRetries) {
                        await this.delay(retryDelay * attempt);
                        continue;
                    }
                }

                return response;
            } catch (error) {
                lastError = error;
                this.logError(error, { url, attempt, maxRetries });

                if (attempt < maxRetries) {
                    await this.delay(retryDelay * attempt);
                }
            }
        }

        throw lastError;
    }

    // Utility method for delays
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Handle form validation errors
    public handleValidationErrors(errors: ValidationError[]): Record<string, string> {
        const fieldErrors: Record<string, string> = {};

        errors.forEach(error => {
            fieldErrors[error.field] = error.error;
        });

        return fieldErrors;
    }

    // Check if error is retryable
    public isRetryableError(error: any): boolean {
        if (error instanceof AppError) {
            return error.statusCode >= 500;
        }

        // Network errors are usually retryable
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return true;
        }

        return false;
    }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility function for handling async operations
export const handleAsync = async <T>(
    asyncFn: () => Promise<T>,
    context?: string
): Promise<{ data: T | null; error: string | null }> => {
    try {
        const data = await asyncFn();
        return { data, error: null };
    } catch (error) {
        const errorType = errorHandler.categorizeError(error);
        const errorMessage = errorHandler.getErrorMessage(error, errorType);

        errorHandler.logError(error, context);

        return { data: null, error: errorMessage };
    }
};

// Hook for error handling in React components
export const useErrorHandler = () => {
    const handleError = (error: any, context?: string) => {
        const errorType = errorHandler.categorizeError(error);
        const errorMessage = errorHandler.getErrorMessage(error, errorType);

        errorHandler.logError(error, context);

        return errorMessage;
    };

    const handleApiError = async (response: Response) => {
        const apiError = await errorHandler.handleApiError(response);
        const errorType = errorHandler.categorizeError(apiError, response);
        const errorMessage = errorHandler.getErrorMessage(apiError, errorType);

        errorHandler.logError(apiError, { response: response.status });

        return errorMessage;
    };

    return {
        handleError,
        handleApiError,
        errorHandler
    };
};
