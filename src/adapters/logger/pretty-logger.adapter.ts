import type { LoggerLevel, LoggerPort } from '../../ports/logger.port.js';

const colors = {
    reset: '\u001B[0m',
    dim: '\u001B[2m',
    debug: '\u001B[36m',
    info: '\u001B[32m',
    warn: '\u001B[33m',
    error: '\u001B[31m',
    key: '\u001B[90m',
    string: '\u001B[36m',
    number: '\u001B[33m',
    boolean: '\u001B[35m',
};

const RANKS: Record<LoggerLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    silent: Infinity,
};

const BARE_STRING_LENGTH = 20;

const INLINE_ITEMS = 3;

const INLINE_KEYS = 2;

const painted = (color: string, text: string): string => `${color}${text}${colors.reset}`;

const formatTimestamp = (): string => new Date().toTimeString().slice(0, 8);

function formatObject(value: object): string {
    if (value instanceof Error) {
        return painted(colors.error, value.message);
    }
    if (Array.isArray(value)) {
        return value.length <= INLINE_ITEMS
            ? `[${value.map((item: unknown) => formatValue(item)).join(', ')}]`
            : painted(colors.dim, `[${value.length} items]`);
    }
    const entries = Object.entries(value);
    return entries.length <= INLINE_KEYS
        ? `{${entries.map(([key, item]) => `${key}:${formatValue(item)}`).join(' ')}}`
        : painted(colors.dim, `{${entries.length} keys}`);
}

function formatValue(value: unknown): string {
    if (typeof value === 'string') {
        return value.length <= BARE_STRING_LENGTH && !/\s/u.test(value)
            ? painted(colors.string, value)
            : painted(colors.string, `"${value}"`);
    }
    if (typeof value === 'number') {
        return painted(colors.number, value.toString());
    }
    if (typeof value === 'boolean') {
        return painted(colors.boolean, value.toString());
    }
    if (typeof value === 'object') {
        return value === null ? painted(colors.dim, 'null') : formatObject(value);
    }
    if (typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol') {
        return painted(colors.dim, value.toString());
    }

    return painted(colors.dim, 'undefined');
}

function formatProps(meta: Record<string, unknown>): string {
    return Object.entries(meta)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${painted(colors.key, key)}=${formatValue(value)}`)
        .join(' ');
}

/** Colored lines for local development: `INFO  [12:34:56]: server.started  port=3000`. */
export class PrettyLoggerAdapter implements LoggerPort {
    private readonly bindings: Record<string, unknown>;
    private readonly level: LoggerLevel;

    constructor(
        options: {
            bindings?: Record<string, unknown>;
            level?: LoggerLevel;
        } = {},
    ) {
        this.bindings = options.bindings ?? {};
        this.level = options.level ?? 'info';
    }

    child(bindings: Record<string, unknown>): LoggerPort {
        return new PrettyLoggerAdapter({
            bindings: { ...this.bindings, ...bindings },
            level: this.level,
        });
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        this.log('debug', message, meta);
    }

    error(message: string, meta?: Record<string, unknown>): void {
        this.log('error', message, meta);
    }

    info(message: string, meta?: Record<string, unknown>): void {
        this.log('info', message, meta);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        this.log('warn', message, meta);
    }

    private log(
        level: Exclude<LoggerLevel, 'silent'>,
        message: string,
        meta?: Record<string, unknown>,
    ): void {
        if (RANKS[level] < RANKS[this.level]) {
            return;
        }

        const label = painted(colors[level], level.toUpperCase().padEnd(5));
        const props = formatProps({ ...this.bindings, ...meta });
        const head = `${label} ${painted(colors.dim, `[${formatTimestamp()}]`)}: ${message}`;
        const line = props === '' ? `${head}\n` : `${head}  ${props}\n`;

        if (level === 'error') {
            process.stderr.write(line);
        } else {
            process.stdout.write(line);
        }
    }
}
