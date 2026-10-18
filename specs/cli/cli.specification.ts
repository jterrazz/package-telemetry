import { specification } from '@jterrazz/test';
import { afterAll } from 'vitest';

// invariant: the spawned node inherits this process's environment, so every OTEL_* the developer's or CI's shell carries is unset, whatever its name.
const inheritedTelemetry = Object.fromEntries(
    Object.keys(process.env)
        .filter((name) => name.startsWith('OTEL_'))
        .map((name) => [name, null]),
);

// hazard: NODE_OPTIONS stays inherited: the mutation run hands every spawned node its coverage reporter through it.
export const { cleanup, cli } = await specification.cli('node', {
    defaults: {
        ...inheritedTelemetry,
        NODE_ENV: 'production',
        OTEL_EXPORTER_OTLP_ENDPOINT: null,
        OTEL_EXPORTER_OTLP_HEADERS: null,
        OTEL_RESOURCE_ATTRIBUTES: null,
        OTEL_SDK_DISABLED: null,
        OTEL_SERVICE_NAME: 'consumer',
        TZ: 'UTC',
    },
});

afterAll(cleanup);
