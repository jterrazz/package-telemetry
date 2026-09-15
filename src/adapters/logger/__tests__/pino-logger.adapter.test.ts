import { describe, expect, test } from 'vitest';

import { PinoLoggerAdapter } from '../pino-logger.adapter.js';

function createCapture() {
    const lines: string[] = [];

    return {
        lines,
        /** The n-th captured line, parsed as JSON — throws when nothing was captured. */
        read<TLog>(index = 0): TLog {
            const line = lines[index];

            if (line === undefined) {
                throw new Error(`no line captured at index ${index}`);
            }

            return JSON.parse(line) as TLog;
        },
        stream: {
            write(chunk: string) {
                lines.push(chunk);
            },
        },
    };
}

describe('pinoLoggerAdapter', () => {
    test('should log structured JSON with level, message and meta', () => {
        // Given
        const capture = createCapture();
        const logger = new PinoLoggerAdapter({ destination: capture.stream, level: 'debug' });

        // When
        logger.info('Test message', { userId: 123 });

        // Then
        const log = capture.read<{
            level: string;
            meta: { userId: number };
            msg: string;
        }>();
        expect(log.level).toBe('info');
        expect(log.msg).toBe('Test message');
        expect(log.meta).toStrictEqual({ userId: 123 });
    });

    test('should serialize errors with message and stack', () => {
        // Given
        const capture = createCapture();
        const logger = new PinoLoggerAdapter({ destination: capture.stream, level: 'debug' });

        // When
        logger.error('Something failed', { error: new Error('boom'), requestId: 'r-1' });

        // Then
        const log = capture.read<{
            error: { message: string; stack: string };
            level: string;
            meta: { requestId: string };
        }>();
        expect(log.level).toBe('error');
        expect(log.error.message).toBe('boom');
        expect(log.error.stack).toContain('Error: boom');
        expect(log.meta).toStrictEqual({ requestId: 'r-1' });
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
        const log = capture.read<{ requestId: string }>();
        expect(log.requestId).toBe('r-42');
    });
});
