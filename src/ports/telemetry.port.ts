/**
 * Attributes attached to spans, metrics and span events.
 * Values must be primitives — OpenTelemetry drops anything else.
 */
export type TelemetryAttributes = Record<string, boolean | number | string | undefined>;
