import { OtelMetricsAdapter } from '../adapters/metrics/otel-metrics.adapter.js';
import type { MetricsPort, TelemetryMetrics } from '../ports/metrics.port.js';

export interface CreateMetricsOptions {
    /** Meter name (defaults to OTEL_SERVICE_NAME) */
    name?: string;
    /** Prefix applied to every metric name: '{namespace}.{name}' */
    namespace?: string;
}

/**
 * Create an OpenTelemetry-backed metrics recorder. A no-op until the SDK
 * is registered via '@jterrazz/telemetry/register'.
 *
 * Type the catalogue to get a compile-time metrics plan:
 *
 * ```ts
 * type AppMetrics = TelemetryBaseMetrics & {
 *     'articles.processed': { source: string };
 * };
 * const metrics = createMetrics<AppMetrics>({ namespace: 'signews' });
 * ```
 */
export function createMetrics<TMetrics extends TelemetryMetrics = TelemetryMetrics>(
    options: CreateMetricsOptions = {},
): MetricsPort<TMetrics> {
    return new OtelMetricsAdapter<TMetrics>(options);
}
