import type { TelemetryAttributes } from './telemetry.port.js';

/**
 * Metrics port - defines how to record counters, histograms and gauges,
 * independently of any metrics vendor.
 *
 * Metric names follow OpenTelemetry conventions: lowercase dot.case
 * (e.g. 'task.started', 'articles.processed'). The application domain is
 * NOT part of the name — inject it once via the adapter's `namespace`
 * option and every metric is emitted as '{namespace}.{name}'.
 */

/**
 * Metric catalogue: metric name → typed attributes. Compose with the base
 * catalogue to get a compile-time metrics plan:
 *
 * ```ts
 * type AppMetrics = TelemetryBaseMetrics & {
 *     'articles.processed': { source: string };
 * };
 * const metrics = createMetrics<AppMetrics>({ namespace: 'signews' });
 * ```
 *
 * Note: use a type alias (`&`), not an interface — interfaces lack the
 * implicit index signature required by the catalogue constraint.
 */
export type TelemetryMetrics = Record<string, TelemetryAttributes>;

/**
 * Base catalogue shipped with the package — generic task lifecycle metrics
 * shared by every app, so dashboards can be uniform across services.
 * 'task.duration' is a histogram in milliseconds; the others are counters.
 */
export type TelemetryBaseMetrics = {
    'task.completed': { task: string };
    'task.duration': { task: string };
    'task.failed': { reason?: string; task: string };
    'task.started': { task: string };
};

export interface MetricsCounterOptions<
    TAttributes extends TelemetryAttributes = TelemetryAttributes,
> {
    attributes?: TAttributes;
    /** Increment step (defaults to 1) */
    value?: number;
}

export interface MetricsPort<TMetrics extends TelemetryMetrics = TelemetryMetrics> {
    /**
     * Increment a counter metric
     */
    counter: <TName extends keyof TMetrics & string>(
        name: TName,
        options?: MetricsCounterOptions<TMetrics[TName]>,
    ) => void;

    /**
     * Record the current value of a gauge metric (e.g. queue depth)
     */
    gauge: <TName extends keyof TMetrics & string>(
        name: TName,
        value: number,
        options?: MetricsRecordOptions<TMetrics[TName]>,
    ) => void;

    /**
     * Record a histogram value (timings, sizes, ...)
     */
    histogram: <TName extends keyof TMetrics & string>(
        name: TName,
        value: number,
        options?: MetricsRecordOptions<TMetrics[TName]>,
    ) => void;
}

export interface MetricsRecordOptions<
    TAttributes extends TelemetryAttributes = TelemetryAttributes,
> {
    attributes?: TAttributes;
}
