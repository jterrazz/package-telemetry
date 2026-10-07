import { OtelMetricsAdapter } from '../adapters/metrics/otel-metrics.adapter.js';
import type { MetricsPort, TelemetryMetrics } from '../ports/metrics.port.js';

export type CreateMetricsOptions = {
    /** Meter name (defaults to OTEL_SERVICE_NAME) */
    name?: string;
    /** Prefix applied to every metric name: '{namespace}.{name}' */
    namespace?: string;
};

/** An OpenTelemetry metrics recorder typed by its catalogue, a no-op until `@jterrazz/telemetry/register` registers the SDK. */
export function createMetrics<TMetrics extends TelemetryMetrics = TelemetryMetrics>(
    options: CreateMetricsOptions = {},
): MetricsPort<TMetrics> {
    return new OtelMetricsAdapter<TMetrics>(options);
}
