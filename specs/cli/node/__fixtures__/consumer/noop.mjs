import {
    createLogger,
    createMetrics,
    createTracer,
    NoopLoggerAdapter,
    NoopMetricsAdapter,
    NoopTracerAdapter,
} from '@jterrazz/telemetry';

const logger = new NoopLoggerAdapter();
logger.child({ requestId: 'r-42' }).info('request.served');
logger.debug('hidden');
logger.warn('hidden');
logger.error('hidden');

const recorder = new NoopMetricsAdapter();
recorder.counter('orders.placed');
recorder.gauge('queue.depth', 7);
recorder.histogram('checkout.duration', 125);
recorder.observableGauge('cart.size', (observe) => {
    observe(3);
});

const tracer = new NoopTracerAdapter();
tracer.event('cart.priced');
tracer.setAttribute('cart.paid', true);
const total = await tracer.span('checkout.run', async () => 42);
console.log(`the span answered ${total}`);

const metrics = createMetrics({ namespace: 'shop' });
metrics.counter('orders.placed', { attributes: { channel: 'web' } });
metrics.gauge('queue.depth', 7);
metrics.histogram('checkout.duration', 125);
metrics.observableGauge('cart.size', (observe) => {
    observe(3);
});

const otelTracer = createTracer({ namespace: 'shop' });
otelTracer.event('outside.span');
otelTracer.setAttribute('outside.span', 1);
const priced = await otelTracer.span('checkout.run', async () => {
    otelTracer.event('cart.priced');
    otelTracer.setAttribute('cart.paid', true);
    return 7;
});
console.log(`the unregistered span answered ${priced}`);
await otelTracer
    .span('payment.charge', async () => {
        throw new Error('card declined');
    })
    .catch((error) => {
        console.log(`the unregistered span rethrew ${error.message}`);
    });

createLogger({ otlp: true, pretty: true }).info('request.served', { status: 200 });
