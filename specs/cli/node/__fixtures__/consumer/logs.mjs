import { createLogger } from '@jterrazz/telemetry';

const logger = createLogger();
logger.debug('cache.warmed', { entries: 3 });
logger.child({ requestId: 'r-42' }).info('request.served', { status: 200 });
logger.error('request.failed', {
    error: Object.assign(new Error('boom'), { code: 'E_BOOM' }),
    requestId: 'r-43',
});
