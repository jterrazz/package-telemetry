import { describe, expect, test, vi } from 'vitest';

import type { LoggerPort } from '../../ports/logger.port.js';
import { OtelLoggerAdapter } from './otel-logger.adapter.js';

function createInnerLogger(): LoggerPort {
    const logger: LoggerPort = {
        child: vi.fn(() => logger),
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    };
    return logger;
}

describe('OtelLoggerAdapter', () => {
    test('should forward every level to the wrapped logger', () => {
        // Given
        const inner = createInnerLogger();
        const logger = new OtelLoggerAdapter(inner);

        // When
        logger.debug('d', { a: 1 });
        logger.info('i');
        logger.warn('w');
        logger.error('e');

        // Then — the OTEL side is a no-op without SDK, stdout side must work
        expect(inner.debug).toHaveBeenCalledWith('d', { a: 1 });
        expect(inner.info).toHaveBeenCalledWith('i', undefined);
        expect(inner.warn).toHaveBeenCalledWith('w', undefined);
        expect(inner.error).toHaveBeenCalledWith('e', undefined);
    });

    test('should forward child bindings to the wrapped logger', () => {
        // Given
        const inner = createInnerLogger();
        const logger = new OtelLoggerAdapter(inner);

        // When
        const child = logger.child({ requestId: 'r-1' });
        child.info('scoped');

        // Then
        expect(inner.child).toHaveBeenCalledWith({ requestId: 'r-1' });
        expect(inner.info).toHaveBeenCalledWith('scoped', undefined);
    });

    test('should accumulate bindings across nested children', () => {
        // Given
        const inner = createInnerLogger();
        const logger = new OtelLoggerAdapter(inner);

        // When
        logger.child({ a: 1 }).child({ b: 2 }).info('nested');

        // Then
        expect(inner.child).toHaveBeenCalledWith({ a: 1 });
        expect(inner.child).toHaveBeenCalledWith({ b: 2 });
        expect(inner.info).toHaveBeenCalledWith('nested', undefined);
    });
});
