import { directory } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';
import { installPacked } from './__setup__/packed.js';

describe('declarations', () => {
    test('a consumer compiles against the declarations the tarball ships', async () => {
        // Given - a consumer's module typed by a metric catalogue, with the compiler and the Node types beside the packed package
        const result = await cli
            .fixture(directory('./__fixtures__/consumer/'))
            .link('typescript')
            .link('@types/node')
            .prepare(installPacked)
            .exec('node_modules/typescript/bin/tsc -p .');

        // Then - the catalogue's names and attributes type-check, and an undeclared one is refused where the consumer expects it
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch('');
    });
});
