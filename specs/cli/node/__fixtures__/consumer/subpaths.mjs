import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const imported = await import('@jterrazz/telemetry');
const required = require('@jterrazz/telemetry');
const register = await import('@jterrazz/telemetry/register');
await register.registerTelemetry();

for (const [subpath, names] of [
    ['@jterrazz/telemetry (import)', Object.keys(imported)],
    ['@jterrazz/telemetry (require)', Object.keys(required)],
    ['@jterrazz/telemetry/register (import)', Object.keys(register)],
]) {
    console.log(`${subpath}: ${names.toSorted().join(', ')}`);
}
