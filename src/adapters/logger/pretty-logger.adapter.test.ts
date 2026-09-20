import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { PrettyLoggerAdapter } from './pretty-logger.adapter.js';

/** The line the adapter printed — throws when it printed nothing. */
function printedLine(): string {
    const [call] = vi.mocked(console.log).mock.calls;

    if (!call) {
        throw new Error('console.log was not called');
    }

    return String(call[0]);
}

describe('prettyLoggerAdapter', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('should print level, message and inline props', () => {
        // Given - a logger set to the info level
        const logger = new PrettyLoggerAdapter({ level: 'info' });

        // When
        logger.info('server.started', { port: 3000 });

        // Then - the printed line carries the level, message and inline props
        const output = printedLine();
        expect(output).toContain('INFO');
        expect(output).toContain('server.started');
        expect(output).toContain('port');
        expect(output).toContain('3000');
    });

    test('should route errors to console.error', () => {
        // Given - a logger set to the info level
        const logger = new PrettyLoggerAdapter({ level: 'info' });

        // When
        logger.error('request.failed');

        // Then - the error is routed to console.error, not console.log
        expect(console.error).toHaveBeenCalledOnce();
        expect(console.log).not.toHaveBeenCalled();
    });

    test('should respect the minimum level, including silent', () => {
        // Given - a logger set to the silent level
        const logger = new PrettyLoggerAdapter({ level: 'silent' });

        // When
        logger.error('hidden');
        logger.info('hidden');

        // Then - nothing is printed at any level
        expect(console.log).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
    });

    test('should merge child bindings into props', () => {
        // Given - a logger set to the info level
        const logger = new PrettyLoggerAdapter({ level: 'info' });

        // When
        logger.child({ requestId: 'r-42' }).info('with context');

        // Then - the child's bindings appear in the printed props
        const output = printedLine();
        expect(output).toContain('requestId');
        expect(output).toContain('r-42');
    });
});
