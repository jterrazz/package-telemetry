import { type Attributes, SpanStatusCode, trace, type Tracer } from '@opentelemetry/api';

import type { TelemetryAttributes } from '../../ports/telemetry.port.js';
import type { TracerPort, TracerSpanOptions } from '../../ports/tracer.port.js';

function sanitizeAttributes(attributes?: TelemetryAttributes): Attributes {
    if (!attributes) {
        return {};
    }

    const result: Attributes = {};
    for (const [key, value] of Object.entries(attributes)) {
        if (value !== undefined) {
            result[key] = value;
        }
    }
    return result;
}

/**
 * OpenTelemetry tracer adapter, for manual spans alongside auto-instrumentation.
 *
 * Uses only '@opentelemetry/api': a no-op until the SDK is registered by
 * '@jterrazz/telemetry/register', so it is always safe to instantiate —
 * including in tests and local runs without a collector.
 */
export class OtelTracerAdapter implements TracerPort {
    private readonly namespace?: string;
    private readonly tracer: Tracer;

    constructor(options: { name?: string; namespace?: string } = {}) {
        this.namespace = options.namespace;
        this.tracer = trace.getTracer(
            options.name ?? process.env.OTEL_SERVICE_NAME ?? 'unknown-service',
        );
    }

    event(name: string, attributes?: TelemetryAttributes): void {
        const currentSpan = trace.getActiveSpan();
        if (!currentSpan) {
            // No active span - event will be dropped. This is often intentional.
            return;
        }
        currentSpan.addEvent(name, sanitizeAttributes(attributes));
    }

    setAttribute(key: string, value: boolean | number | string): void {
        const currentSpan = trace.getActiveSpan();
        if (!currentSpan) {
            // No active span - attribute will be dropped. This is often intentional.
            return;
        }
        currentSpan.setAttribute(key, value);
    }

    async span<T>(name: string, fn: () => Promise<T>, options?: TracerSpanOptions): Promise<T> {
        const spanName = this.namespace ? `${this.namespace}.${name}` : name;

        return this.tracer.startActiveSpan(
            spanName,
            { attributes: sanitizeAttributes(options?.attributes) },
            async (span) => {
                try {
                    const result = await fn();
                    span.setStatus({ code: SpanStatusCode.OK });
                    return result;
                } catch (error) {
                    span.setStatus({
                        code: SpanStatusCode.ERROR,
                        message: error instanceof Error ? error.message : String(error),
                    });
                    if (error instanceof Error) {
                        span.recordException(error);
                    }
                    throw error;
                } finally {
                    span.end();
                }
            },
        );
    }
}
