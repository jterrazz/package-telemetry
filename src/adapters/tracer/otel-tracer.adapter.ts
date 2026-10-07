import { SpanStatusCode, trace } from '@opentelemetry/api';
import type { Tracer } from '@opentelemetry/api';

import type { TelemetryAttributes } from '../../ports/telemetry.port.js';
import type { TracerPort, TracerSpanOptions } from '../../ports/tracer.port.js';

/** Manual spans beside auto-instrumentation, through the global OpenTelemetry TracerProvider — a no-op until `@jterrazz/telemetry/register` registers one. */
export class OtelTracerAdapter implements TracerPort {
    private readonly namespace: string | undefined;
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
            return;
        }
        currentSpan.addEvent(name, attributes);
    }

    setAttribute(key: string, value: boolean | number | string): void {
        const currentSpan = trace.getActiveSpan();
        if (!currentSpan) {
            return;
        }
        currentSpan.setAttribute(key, value);
    }

    async span<T>(name: string, fn: () => Promise<T>, options?: TracerSpanOptions): Promise<T> {
        const spanName =
            this.namespace === undefined || this.namespace === ''
                ? name
                : `${this.namespace}.${name}`;

        return await this.tracer.startActiveSpan(
            spanName,
            { attributes: options?.attributes ?? {} },
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
