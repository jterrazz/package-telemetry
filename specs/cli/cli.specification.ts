import { specification } from '@jterrazz/test';
import { afterAll } from 'vitest';

export const { cleanup, cli } = await specification.cli('node', {
    defaults: {
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
