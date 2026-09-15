import bundle from '@jterrazz/typescript/tsdown/bundle.js';

export default [
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
];
