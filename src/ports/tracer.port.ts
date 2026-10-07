import type { TelemetryAttributes } from './telemetry.port.js';

// outside: OpenTelemetry names a span in lowercase dot.case and keeps the name low-cardinality ('pipeline.run'); an id or a url is an attribute, never part of the name.
export type TracerPort = {
    /** Adds an event to the active span; dropped when no span is active. */
    event: (name: string, attributes?: TelemetryAttributes) => void;

    /** Sets an attribute on the active span; dropped when no span is active. */
    setAttribute: (key: string, value: boolean | number | string) => void;

    /** Runs `fn` in a span that records its timing, its status and any error it throws, then rethrows. */
    span: <T>(name: string, fn: () => Promise<T>, options?: TracerSpanOptions) => Promise<T>;
};

export type TracerSpanOptions = {
    attributes?: TelemetryAttributes;
};
