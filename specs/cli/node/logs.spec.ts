import { directory } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';
import { installPacked } from './__setup__/packed.js';

describe('logs', () => {
    test('in production every line is one JSON object on stdout, at or above its level', async () => {
        // Given - a consumer logging in production, with no collector configured
        const result = await cli
            .fixture(directory('./__fixtures__/consumer/'))
            .prepare(installPacked)
            .exec('logs.mjs');

        // Then - meta, child bindings and a serialized error ride on each line, and a debug line stays under the default info level
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(`
            {"level":"info","time":{{int}},"pid":{{int}},"hostname":"{{any}}","requestId":"r-42","meta":{"status":200},"msg":"request.served"}
            {"level":"error","time":{{int}},"pid":{{int}},"hostname":"{{any}}","error":{"code":"E_BOOM","message":"boom","stack":"Error: boom\\n{{any}}"},"meta":{"requestId":"r-43"},"msg":"request.failed"}
        `);
    });

    test('outside production every line is a colored line naming its props', async () => {
        // Given - a consumer logging in development
        const result = await cli
            .fixture(directory('./__fixtures__/consumer/'))
            .env({ NODE_ENV: 'development' })
            .prepare(installPacked)
            .exec('pretty.mjs');

        // Then - each value is written by its type, the child's bindings come first, and errors go to stderr
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(`
            INFO  [{{time}}]: server.started  requestId=r-42 big={3 keys} few=[1, two, false] long="a sentence with spaces" many=[4 items] none=null port=3000 secure=true short=ok small={mode:tls nested:[null]} tags=Symbol(vip) total=10
            WARN  [{{time}}]: disk.low  requestId=r-42
        `);
        expect(result.stderr).toMatch(`
            ERROR [{{time}}]: request.failed  requestId=r-42 error=boom
        `);
    });
});
