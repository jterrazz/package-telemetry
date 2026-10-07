import { directory } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';
import { installPacked } from './__setup__/packed.js';

describe('noop', () => {
    test('the null objects and the unregistered OpenTelemetry adapters record nothing, and a span still answers its function', async () => {
        // Given - a consumer's test handing the no-op adapters to its code, and the factories' OpenTelemetry adapters used without the register entry
        const result = await cli
            .fixture(directory('./__fixtures__/consumer/'))
            .prepare(installPacked)
            .exec('noop.mjs');

        // Then - the run ends cleanly, a span returns its function's value and rethrows its error, and a logger with otlp on still writes its own line
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(`
            the span answered 42
            the unregistered span answered 7
            the unregistered span rethrew card declined
            INFO  [{{time}}]: request.served  status=200
        `);
        expect(result.stderr.text).toBe('');
    });
});
