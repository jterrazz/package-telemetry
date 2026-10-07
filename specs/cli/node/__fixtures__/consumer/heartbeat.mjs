import { metrics, trace } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';
import { createLogger, createMetrics, createTracer } from '@jterrazz/telemetry';

createLogger({ pretty: false }).info('heartbeat');
createMetrics().counter('beats');
await createTracer().span('beat.run', async () => {});

await metrics.getMeterProvider().forceFlush();
await trace.getTracerProvider().getDelegate().forceFlush();
await logs.getLoggerProvider().forceFlush();
console.log('flushed');
