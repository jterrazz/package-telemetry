import { describe, expect, test } from 'vitest';

import { NoopLoggerAdapter } from './noop-logger.adapter.js';

describe('noopLoggerAdapter', () => {
    test('should stay silent', () => {
        // Given - a noop logger and a child scoped from it
        const logger = new NoopLoggerAdapter();

        // Then - every call is a no-op, never throwing
        expect(() => {
            logger.child({ a: 1 }).info('nothing');
        }).not.toThrow();
    });
});
