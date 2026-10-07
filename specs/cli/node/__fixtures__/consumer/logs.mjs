import { createLogger } from '@jterrazz/telemetry';

const error = Object.assign(new Error('boom'), { code: 'E_BOOM' });
error.stack = 'Error: boom\n    at checkout (cart.mjs:1:1)';

const logger = createLogger();
logger.debug('cache.warmed', { entries: 3 });
logger.child({ requestId: 'r-42' }).info('request.served', { status: 200 });
logger.error('request.failed', { error, requestId: 'r-43' });
