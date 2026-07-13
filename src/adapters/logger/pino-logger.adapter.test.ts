import { describe, expect, test } from 'vitest';

import { PinoLoggerAdapter } from './pino-logger.adapter.js';

function createCapture() {
    const lines: string[] = [];
    return {
        lines,
        stream: {
            write(chunk: string) {
                lines.push(chunk);
            },
        },
    };
}

describe('PinoLoggerAdapter', () => {
    test('should log structured JSON with level, message and meta', () => {
        // Given
        const capture = createCapture();
        const logger = new PinoLoggerAdapter({ destination: capture.stream, level: 'debug' });

        // When
        logger.info('Test message', { userId: 123 });

        // Then
        const log = JSON.parse(capture.lines[0]) as {
            level: string;
            meta: { userId: number };
            msg: string;
        };
        expect(log.level).toBe('info');
        expect(log.msg).toBe('Test message');
        expect(log.meta).toEqual({ userId: 123 });
    });

    test('should serialize errors with message and stack', () => {
        // Given
        const capture = createCapture();
        const logger = new PinoLoggerAdapter({ destination: capture.stream, level: 'debug' });

        // When
        logger.error('Something failed', { error: new Error('boom'), requestId: 'r-1' });

        // Then
        const log = JSON.parse(capture.lines[0]) as {
            error: { message: string; stack: string };
            level: string;
            meta: { requestId: string };
        };
        expect(log.level).toBe('error');
        expect(log.error.message).toBe('boom');
        expect(log.error.stack).toContain('Error: boom');
        expect(log.meta).toEqual({ requestId: 'r-1' });
    });

    test('should respect the minimum level', () => {
        // Given
        const capture = createCapture();
        const logger = new PinoLoggerAdapter({ destination: capture.stream, level: 'warn' });

        // When
        logger.debug('hidden');
        logger.info('hidden');
        logger.warn('visible');

        // Then
        expect(capture.lines).toHaveLength(1);
    });

    test('should carry child bindings on every log', () => {
        // Given
        const capture = createCapture();
        const logger = new PinoLoggerAdapter({ destination: capture.stream, level: 'info' });

        // When
        logger.child({ requestId: 'r-42' }).info('with context');

        // Then
        const log = JSON.parse(capture.lines[0]) as { requestId: string };
        expect(log.requestId).toBe('r-42');
    });
});
