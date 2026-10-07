import { OtelTracerAdapter } from '../adapters/tracer/otel-tracer.adapter.js';
import type { TracerPort } from '../ports/tracer.port.js';

export type CreateTracerOptions = {
    /** Tracer name (defaults to OTEL_SERVICE_NAME) */
    name?: string;
    /** Prefix applied to every span name: '{namespace}.{name}' */
    namespace?: string;
};

/** An OpenTelemetry tracer, a no-op until `@jterrazz/telemetry/register` registers the SDK. */
export function createTracer(options: CreateTracerOptions = {}): TracerPort {
    return new OtelTracerAdapter(options);
}
