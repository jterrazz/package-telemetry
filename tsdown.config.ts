import bundle from '@jterrazz/typescript/presets/tsdown/bundle.js';
import { defineConfig } from 'tsdown';

export default defineConfig([
    {
        ...bundle,
        entry: ['src/index.ts'],
    },
    {
        // ESM-only: uses top-level await, and --import requires ESM anyway
        ...bundle,
        clean: false,
        entry: ['src/register.ts'],
        format: ['esm'],
    },
]);
