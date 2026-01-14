export class ApiKeyMissingError extends Error {
    constructor() {
        super('API key is missing');
        this.name = 'ApiKeyMissingError';
    }
}

export class ApiKeyInvalidError extends Error {
    constructor() {
        super('API key is invalid or expired');
        this.name = 'ApiKeyInvalidError';
    }
}

export class RateLimitError extends Error {
    constructor(retryAfter?: number) {
        super(`Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter}s` : ''}`);
        this.name = 'RateLimitError';
    }
}
