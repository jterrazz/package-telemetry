import {
    type Attributes,
    type Counter,
    type Gauge,
    type Histogram,
    type Meter,
    metrics,
} from '@opentelemetry/api';

import type {
    MetricsCounterOptions,
    MetricsPort,
    MetricsRecordOptions,
    TelemetryMetrics,
} from '../../ports/metrics.port.js';
import type { TelemetryAttributes } from '../../ports/telemetry.port.js';

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
 * OpenTelemetry metrics adapter. Metrics flow through OTLP to the collector,
 * which remote-writes them to Prometheus — no /metrics endpoint needed.
 *
 * Uses only '@opentelemetry/api': a no-op until the SDK is registered by
 * '@jterrazz/telemetry/register', so it is always safe to instantiate.
 *
 * The `namespace` option prefixes every metric name ('{namespace}.{name}'),
 * keeping the catalogue domain-free while emitted names stay unique per app.
 */
export class OtelMetricsAdapter<
    TMetrics extends TelemetryMetrics = TelemetryMetrics,
> implements MetricsPort<TMetrics> {
    private readonly counters = new Map<string, Counter>();
    private readonly gauges = new Map<string, Gauge>();
    private readonly histograms = new Map<string, Histogram>();
    private readonly meter: Meter;
    private readonly namespace?: string;

    constructor(options: { name?: string; namespace?: string } = {}) {
        this.namespace = options.namespace;
        this.meter = metrics.getMeter(
            options.name ?? process.env.OTEL_SERVICE_NAME ?? 'unknown-service',
        );
    }

    counter<TName extends keyof TMetrics & string>(
        name: TName,
        options?: MetricsCounterOptions<TMetrics[TName]>,
    ): void {
        const qualifiedName = this.qualify(name);
        let counter = this.counters.get(qualifiedName);
        if (!counter) {
            counter = this.meter.createCounter(qualifiedName);
            this.counters.set(qualifiedName, counter);
        }
        counter.add(options?.value ?? 1, sanitizeAttributes(options?.attributes));
    }

    gauge<TName extends keyof TMetrics & string>(
        name: TName,
        value: number,
        options?: MetricsRecordOptions<TMetrics[TName]>,
    ): void {
        const qualifiedName = this.qualify(name);
        let gauge = this.gauges.get(qualifiedName);
        if (!gauge) {
            gauge = this.meter.createGauge(qualifiedName);
            this.gauges.set(qualifiedName, gauge);
        }
        gauge.record(value, sanitizeAttributes(options?.attributes));
    }

    histogram<TName extends keyof TMetrics & string>(
        name: TName,
        value: number,
        options?: MetricsRecordOptions<TMetrics[TName]>,
    ): void {
        const qualifiedName = this.qualify(name);
        let histogram = this.histograms.get(qualifiedName);
        if (!histogram) {
            histogram = this.meter.createHistogram(qualifiedName);
            this.histograms.set(qualifiedName, histogram);
        }
        histogram.record(value, sanitizeAttributes(options?.attributes));
    }

    private qualify(name: string): string {
        return this.namespace ? `${this.namespace}.${name}` : name;
    }
}
