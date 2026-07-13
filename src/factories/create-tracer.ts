import { OtelTracerAdapter } from '../adapters/tracer/otel-tracer.adapter.js';
import type { TracerPort } from '../ports/tracer.port.js';

export interface CreateTracerOptions {
    /** Tracer name (defaults to OTEL_SERVICE_NAME) */
    name?: string;
    /** Prefix applied to every span name: '{namespace}.{name}' */
    namespace?: string;
}

/**
 * Create an OpenTelemetry-backed tracer. A no-op until the SDK is
 * registered via '@jterrazz/telemetry/register'.
 */
export function createTracer(options: CreateTracerOptions = {}): TracerPort {
    return new OtelTracerAdapter(options);
}
