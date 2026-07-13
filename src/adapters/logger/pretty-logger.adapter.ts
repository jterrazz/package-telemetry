import type { LoggerLevel, LoggerPort } from '../../ports/logger.port.js';

/**
 * ANSI color codes for terminal output
 */
const colors = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    // Levels
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    // Props
    key: '\x1b[90m', // Gray
    string: '\x1b[36m', // Cyan
    number: '\x1b[33m', // Yellow
    boolean: '\x1b[35m', // Magenta
};

/**
 * Pretty logger adapter for local development, with inline props display.
 *
 * Output format:
 * INFO  [12:34:56]: message.name  key=value key2="string value" num=123
 */
export class PrettyLoggerAdapter implements LoggerPort {
    private readonly bindings: Record<string, unknown>;
    private readonly minLevel: number;

    private static readonly levels: Record<LoggerLevel, number> = {
        debug: 10,
        info: 20,
        warn: 30,
        error: 40,
        silent: Infinity,
    };

    constructor(
        options: {
            bindings?: Record<string, unknown>;
            level?: LoggerLevel;
        } = {},
    ) {
        this.bindings = options.bindings ?? {};
        this.minLevel = PrettyLoggerAdapter.levels[options.level ?? 'info'];
    }

    child(bindings: Record<string, unknown>): LoggerPort {
        return new PrettyLoggerAdapter({
            bindings: { ...this.bindings, ...bindings },
            level: this.getLevelName(),
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

    private formatLevel(level: Exclude<LoggerLevel, 'silent'>): string {
        const color = colors[level];
        const label = level.toUpperCase().padEnd(5);
        return `${color}${label}${colors.reset}`;
    }

    private formatProps(meta?: Record<string, unknown>): string {
        if (!meta || Object.keys(meta).length === 0) {
            return '';
        }

        const parts: string[] = [];

        for (const [key, value] of Object.entries(meta)) {
            if (value === undefined) {
                continue;
            }

            const formattedValue = this.formatValue(value);
            parts.push(`${colors.key}${key}${colors.reset}=${formattedValue}`);
        }

        return parts.join(' ');
    }

    private formatTimestamp(): string {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    private formatValue(value: unknown): string {
        if (value === null) {
            return `${colors.dim}null${colors.reset}`;
        }

        if (typeof value === 'string') {
            // Short strings without spaces: no quotes
            if (value.length <= 20 && !/\s/.test(value)) {
                return `${colors.string}${value}${colors.reset}`;
            }
            // Longer or complex strings: use quotes
            return `${colors.string}"${value}"${colors.reset}`;
        }

        if (typeof value === 'number') {
            return `${colors.number}${value}${colors.reset}`;
        }

        if (typeof value === 'boolean') {
            return `${colors.boolean}${value}${colors.reset}`;
        }

        if (value instanceof Error) {
            return `${colors.error}${value.message}${colors.reset}`;
        }

        if (Array.isArray(value)) {
            if (value.length <= 3) {
                const items = value
                    .map((item) => {
                        return this.formatValue(item);
                    })
                    .join(', ');
                return `[${items}]`;
            }
            return `${colors.dim}[${value.length} items]${colors.reset}`;
        }

        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length <= 2) {
                const items = keys
                    .map((key) => {
                        return `${key}:${this.formatValue((value as Record<string, unknown>)[key])}`;
                    })
                    .join(' ');
                return `{${items}}`;
            }
            return `${colors.dim}{${keys.length} keys}${colors.reset}`;
        }

        return `${colors.dim}${String(value)}${colors.reset}`;
    }

    private getLevelName(): LoggerLevel {
        for (const [name, num] of Object.entries(PrettyLoggerAdapter.levels)) {
            if (num === this.minLevel) {
                return name as LoggerLevel;
            }
        }
        return 'info';
    }

    private log(
        level: Exclude<LoggerLevel, 'silent'>,
        message: string,
        meta?: Record<string, unknown>,
    ): void {
        if (PrettyLoggerAdapter.levels[level] < this.minLevel) {
            return;
        }

        const timestamp = this.formatTimestamp();
        const levelStr = this.formatLevel(level);
        const propsStr = this.formatProps({ ...this.bindings, ...meta });

        const output = propsStr
            ? `${levelStr} ${colors.dim}[${timestamp}]${colors.reset}: ${message}  ${propsStr}`
            : `${levelStr} ${colors.dim}[${timestamp}]${colors.reset}: ${message}`;

        if (level === 'error') {
            console.error(output);
        } else {
            console.log(output);
        }
    }
}
