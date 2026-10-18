import { metrics } from '@opentelemetry/api';
import type { Counter, Gauge, Histogram, Meter } from '@opentelemetry/api';

import type {
    MetricsCounterOptions,
    MetricsObserve,
    MetricsPort,
    MetricsRecordOptions,
    TelemetryMetrics,
} from '../../ports/metrics.port.js';

// outside: a meter shares one storage per name, but every create call validates the name, resolves the views and builds a new instrument (sdk-metrics 2.x), so each instrument is made once per name and kept; it drops an attribute whose value is undefined.
/** Records through the global OpenTelemetry MeterProvider, a no-op until `@jterrazz/telemetry/register` registers one; `namespace` prefixes every name. */
export class OtelMetricsAdapter<
    TMetrics extends TelemetryMetrics = TelemetryMetrics,
> implements MetricsPort<TMetrics> {
    private readonly counters = new Map<string, Counter>();
    private readonly gauges = new Map<string, Gauge>();
    private readonly histograms = new Map<string, Histogram>();
    private readonly observableGauges = new Set<string>();
    private readonly meter: Meter;
    private readonly namespace: string | undefined;

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
        // Stryker disable ConditionalExpression,CallExpression: a fresh instrument of a name records into the storage the kept one does; only the cost differs
        if (counter === undefined) {
            counter = this.meter.createCounter(qualifiedName);
            this.counters.set(qualifiedName, counter);
        }
        // Stryker restore ConditionalExpression,CallExpression
        counter.add(options?.value ?? 1, options?.attributes);
    }

    gauge<TName extends keyof TMetrics & string>(
        name: TName,
        value: number,
        options?: MetricsRecordOptions<TMetrics[TName]>,
    ): void {
        const qualifiedName = this.qualify(name);
        let gauge = this.gauges.get(qualifiedName);
        // Stryker disable ConditionalExpression,CallExpression: a fresh instrument of a name records into the storage the kept one does; only the cost differs
        if (gauge === undefined) {
            gauge = this.meter.createGauge(qualifiedName);
            this.gauges.set(qualifiedName, gauge);
        }
        // Stryker restore ConditionalExpression,CallExpression
        gauge.record(value, options?.attributes);
    }

    observableGauge<TName extends keyof TMetrics & string>(
        name: TName,
        sample: (observe: MetricsObserve<TMetrics[TName]>) => void,
    ): void {
        const qualifiedName = this.qualify(name);
        if (this.observableGauges.has(qualifiedName)) {
            return;
        }
        this.observableGauges.add(qualifiedName);

        const gauge = this.meter.createObservableGauge(qualifiedName);
        gauge.addCallback((result) => {
            sample((value, attributes) => {
                result.observe(value, attributes);
            });
        });
    }

    histogram<TName extends keyof TMetrics & string>(
        name: TName,
        value: number,
        options?: MetricsRecordOptions<TMetrics[TName]>,
    ): void {
        const qualifiedName = this.qualify(name);
        let histogram = this.histograms.get(qualifiedName);
        // Stryker disable ConditionalExpression,CallExpression: a fresh instrument of a name records into the storage the kept one does; only the cost differs
        if (histogram === undefined) {
            histogram = this.meter.createHistogram(qualifiedName);
            this.histograms.set(qualifiedName, histogram);
        }
        // Stryker restore ConditionalExpression,CallExpression
        histogram.record(value, options?.attributes);
    }

    private qualify(name: string): string {
        if (this.namespace === undefined || this.namespace === '') {
            return name;
        }

        return `${this.namespace}.${name}`;
    }
}
