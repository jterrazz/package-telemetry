import { NoopLoggerAdapter, NoopMetricsAdapter, NoopTracerAdapter } from '@jterrazz/telemetry';

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
