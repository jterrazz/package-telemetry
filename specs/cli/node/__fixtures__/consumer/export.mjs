import { metrics, trace } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';
import { createLogger, createMetrics, createTracer } from '@jterrazz/telemetry';

const error = new Error('boom');
error.stack = 'Error: boom\n    at checkout (cart.mjs:1:1)';

const logger = createLogger({ level: 'debug' });
logger.debug('cache.warmed', { entries: 3 });
logger
    .child({ requestId: 'r-42' })
    .child({ route: '/cart' })
    .info('request.served', { cached: true, status: 200, user: { id: 7 } });
logger.warn('stock.low', {
    error,
    notify() {},
    reserved: { units: 4n },
    sku: null,
    stock: 10n,
    tag: Symbol('vip'),
    unknown: undefined,
});
const declined = Object.assign(new Error('declined'), { stack: undefined });
logger.error('payment.failed', { attempt: 2, cause: declined });
createLogger({ otlp: false, pretty: true }).error('local.only');

const recorder = createMetrics({ namespace: 'shop' });
recorder.counter('orders.placed', { attributes: { channel: 'web' } });
recorder.counter('orders.placed', { attributes: { channel: 'web' }, value: 2 });
recorder.counter('orders.placed', { attributes: { channel: 'app', coupon: undefined } });
recorder.histogram('checkout.duration', 125, { attributes: { channel: 'web' } });
recorder.histogram('checkout.items', 3);
recorder.gauge('queue.depth', 7);
recorder.observableGauge('cart.size', (observe) => {
    observe(3, { stat: 'mean' });
});
recorder.observableGauge('cart.size', (observe) => {
    observe(99, { stat: 'ignored' });
});

createMetrics({ name: 'orders-meter', namespace: '' }).counter('orders.refunded');

const tracer = createTracer({ namespace: 'shop' });
await tracer.span(
    'checkout.run',
    async () => {
        tracer.event('cart.priced', { items: 3 });
        tracer.setAttribute('cart.paid', true);
    },
    { attributes: { channel: 'web', coupon: undefined } },
);
await tracer.span('payment.charge', async () => {
    throw new Error('card declined');
}).catch(() => {});
await createTracer({ name: 'jobs-tracer', namespace: '' }).span('nightly.run', async () => {});
await tracer
    .span('coupon.apply', async () => {
        throw 'coupon expired';
    })
    .catch(() => {});
tracer.event('dropped.event');
tracer.setAttribute('dropped.attribute', 1);

await metrics.getMeterProvider().forceFlush();
await trace.getTracerProvider().getDelegate().forceFlush();
await logs.getLoggerProvider().forceFlush();
console.log('flushed');
