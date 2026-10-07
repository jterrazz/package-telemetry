import { createLogger, PrettyLoggerAdapter } from '@jterrazz/telemetry';

const error = new Error('boom');

const logger = createLogger({ level: 'debug' }).child({ requestId: 'r-42' });
logger.debug('cache.warmed');
logger.info('server.started', {
    big: { a: 1, b: 2, c: 3 },
    edge: 'abcdefghijklmnopqrst',
    few: [1, 'two', false],
    gaps: [undefined, null],
    handler: function checkout() {},
    long: 'a sentence with spaces',
    many: [1, 2, 3, 4],
    missing: undefined,
    none: null,
    port: 3000,
    secure: true,
    short: 'ok',
    small: { mode: 'tls', nested: [null] },
    spaced: 'two words',
    tags: Symbol('vip'),
    token: 'abcdefghijklmnopqrstu',
    total: 10n,
});
logger.warn('disk.low');
logger.error('request.failed', { error });

const bare = new PrettyLoggerAdapter();
bare.debug('hidden');
bare.info('ready');
