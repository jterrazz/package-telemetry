import { createLogger } from '@jterrazz/telemetry';

const quiet = createLogger({ level: 'warn' });
quiet.debug('hidden');
quiet.info('hidden');
quiet.warn('disk.low');
quiet.error('disk.full');

const silent = createLogger({ level: 'silent' });
silent.warn('hidden');
silent.error('hidden');
