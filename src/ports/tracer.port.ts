import type { TelemetryAttributes } from './telemetry.port.js';

/**
 * Tracer port - defines how to trace operations as spans, independently of
 * any tracing vendor.
 *
 * Span names follow OpenTelemetry conventions: lowercase dot.case, low
 * cardinality (e.g. 'pipeline.run', 'articles.fetch'). High-cardinality
 * detail (ids, urls) belongs in attributes, never in the name.
 */
export interface TracerPort {
    /**
     * Add an event to the currently active span. Dropped when no span is
     * active — this is often intentional.
     */
    event: (name: string, attributes?: TelemetryAttributes) => void;

    /**
     * Set an attribute on the currently active span. Dropped when no span
     * is active.
     */
    setAttribute: (key: string, value: boolean | number | string) => void;

    /**
     * Execute a function within a traced span. The span records timing,
     * status and any thrown error, then rethrows.
     */
    span: <T>(name: string, fn: () => Promise<T>, options?: TracerSpanOptions) => Promise<T>;
}

export interface TracerSpanOptions {
    attributes?: TelemetryAttributes;
}
