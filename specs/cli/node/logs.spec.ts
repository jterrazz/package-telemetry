import { directory, text } from '@jterrazz/test';
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
            {"level":"info","time":{{int}},"pid":{{int}},"hostname":"{{string}}","requestId":"r-42","meta":{"status":200},"msg":"request.served"}
            {"level":"error","time":{{int}},"pid":{{int}},"hostname":"{{string}}","error":{"code":"E_BOOM","message":"boom","stack":"Error: boom\\n    at checkout (cart.mjs:1:1)"},"meta":{"requestId":"r-43"},"msg":"request.failed"}
        `);
    });

    test('outside production every line is a colored line naming its props', async () => {
        // Given - a consumer logging in development
        const result = await cli
            .fixture(directory('./__fixtures__/consumer/'))
            .env({ NODE_ENV: 'development' })
            .prepare(installPacked)
            .exec('pretty.mjs');

        // Then - each level and each value has its color, the child's bindings come first, errors go to stderr, and a logger built bare keeps the info level
        expect(result.exitCode).toBe(0);
        const painted = result.stdout.raw.replaceAll('\u001B', String.raw`\e`);
        expect(text(painted)).toMatch(`
            \\e[36mDEBUG\\e[0m \\e[2m[{{time}}]\\e[0m: cache.warmed  \\e[90mrequestId\\e[0m=\\e[36mr-42\\e[0m
            \\e[32mINFO \\e[0m \\e[2m[{{time}}]\\e[0m: server.started  \\e[90mrequestId\\e[0m=\\e[36mr-42\\e[0m \\e[90mbig\\e[0m=\\e[2m{3 keys}\\e[0m \\e[90medge\\e[0m=\\e[36mabcdefghijklmnopqrst\\e[0m \\e[90mfew\\e[0m=[\\e[33m1\\e[0m, \\e[36mtwo\\e[0m, \\e[35mfalse\\e[0m] \\e[90mgaps\\e[0m=[\\e[2mundefined\\e[0m, \\e[2mnull\\e[0m] \\e[90mhandler\\e[0m=\\e[2mfunction checkout() {}\\e[0m \\e[90mlong\\e[0m=\\e[36m"a sentence with spaces"\\e[0m \\e[90mmany\\e[0m=\\e[2m[4 items]\\e[0m \\e[90mnone\\e[0m=\\e[2mnull\\e[0m \\e[90mport\\e[0m=\\e[33m3000\\e[0m \\e[90msecure\\e[0m=\\e[35mtrue\\e[0m \\e[90mshort\\e[0m=\\e[36mok\\e[0m \\e[90msmall\\e[0m={mode:\\e[36mtls\\e[0m nested:[\\e[2mnull\\e[0m]} \\e[90mspaced\\e[0m=\\e[36m"two words"\\e[0m \\e[90mtags\\e[0m=\\e[2mSymbol(vip)\\e[0m \\e[90mtoken\\e[0m=\\e[36m"abcdefghijklmnopqrstu"\\e[0m \\e[90mtotal\\e[0m=\\e[2m10\\e[0m
            \\e[33mWARN \\e[0m \\e[2m[{{time}}]\\e[0m: disk.low  \\e[90mrequestId\\e[0m=\\e[36mr-42\\e[0m
            \\e[32mINFO \\e[0m \\e[2m[{{time}}]\\e[0m: ready
        `);
        expect(text(result.stderr.raw.replaceAll('\u001B', String.raw`\e`))).toMatch(`
            \\e[31mERROR\\e[0m \\e[2m[{{time}}]\\e[0m: request.failed  \\e[90mrequestId\\e[0m=\\e[36mr-42\\e[0m \\e[90merror\\e[0m=\\e[31mboom\\e[0m
        `);
    });
});
