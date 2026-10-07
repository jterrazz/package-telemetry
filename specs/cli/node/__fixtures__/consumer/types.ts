import { createLogger, createMetrics, createTracer } from '@jterrazz/telemetry';
import type { LoggerPort, TelemetryBaseMetrics, TracerPort } from '@jterrazz/telemetry';
import { registerTelemetry } from '@jterrazz/telemetry/register';

type ShopMetrics = TelemetryBaseMetrics & { 'orders.placed': { channel: string } };

const metrics = createMetrics<ShopMetrics>({ namespace: 'shop' });
metrics.counter('orders.placed', { attributes: { channel: 'web' } });
metrics.histogram('task.duration', 125, { attributes: { task: 'checkout' } });
// @ts-expect-error an attribute the catalogue does not declare is refused
metrics.counter('orders.placed', { attributes: { region: 'eu' } });
// @ts-expect-error a metric the catalogue does not declare is refused
metrics.counter('orders.refunded');

const logger: LoggerPort = createLogger({ level: 'warn' });
const tracer: TracerPort = createTracer({ namespace: 'shop' });
const total: Promise<number> = tracer.span('checkout.run', async () => 42);
const started: Promise<void> = registerTelemetry();

export { logger, started, total };
