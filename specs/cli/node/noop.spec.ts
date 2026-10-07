import { directory } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';
import { installPacked } from './__setup__/packed.js';

describe('noop', () => {
    test('the no-op adapters record nothing, and a span still answers its function', async () => {
        // Given - a consumer's test handing the no-op logger, metrics and tracer to its code
        const result = await cli
            .fixture(directory('./__fixtures__/consumer/'))
            .prepare(installPacked)
            .exec('noop.mjs');

        // Then - nothing is logged or exported, and the span's function ran and returned its value
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(`
            the span answered 42
        `);
    });
});
