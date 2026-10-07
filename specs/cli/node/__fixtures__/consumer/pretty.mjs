import { createLogger } from '@jterrazz/telemetry';

const logger = createLogger().child({ requestId: 'r-42' });
logger.debug('hidden');
logger.info('server.started', {
    big: { a: 1, b: 2, c: 3 },
    few: [1, 'two', false],
    long: 'a sentence with spaces',
    many: [1, 2, 3, 4],
    missing: undefined,
    none: null,
    port: 3000,
    secure: true,
    short: 'ok',
    small: { mode: 'tls', nested: [null] },
    tags: Symbol('vip'),
    total: 10n,
});
logger.warn('disk.low');
logger.error('request.failed', { error: new Error('boom') });
