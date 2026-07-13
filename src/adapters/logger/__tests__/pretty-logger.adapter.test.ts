import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { PrettyLoggerAdapter } from '../pretty-logger.adapter.js';

describe('PrettyLoggerAdapter', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('should print level, message and inline props', () => {
        // Given
        const logger = new PrettyLoggerAdapter({ level: 'info' });

        // When
        logger.info('server.started', { port: 3000 });

        // Then
        const output = vi.mocked(console.log).mock.calls[0][0] as string;
        expect(output).toContain('INFO');
        expect(output).toContain('server.started');
        expect(output).toContain('port');
        expect(output).toContain('3000');
    });

    test('should route errors to console.error', () => {
        // Given
        const logger = new PrettyLoggerAdapter({ level: 'info' });

        // When
        logger.error('request.failed');

        // Then
        expect(console.error).toHaveBeenCalledOnce();
        expect(console.log).not.toHaveBeenCalled();
    });

    test('should respect the minimum level, including silent', () => {
        // Given
        const logger = new PrettyLoggerAdapter({ level: 'silent' });

        // When
        logger.error('hidden');
        logger.info('hidden');

        // Then
        expect(console.log).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
    });

    test('should merge child bindings into props', () => {
        // Given
        const logger = new PrettyLoggerAdapter({ level: 'info' });

        // When
        logger.child({ requestId: 'r-42' }).info('with context');

        // Then
        const output = vi.mocked(console.log).mock.calls[0][0] as string;
        expect(output).toContain('requestId');
        expect(output).toContain('r-42');
    });
});
