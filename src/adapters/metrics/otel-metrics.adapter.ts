import { metrics } from '@opentelemetry/api';
import type { Meter } from '@opentelemetry/api';

import type {
    MetricsCounterOptions,
    MetricsObserve,
    MetricsPort,
    MetricsRecordOptions,
    TelemetryMetrics,
} from '../../ports/metrics.port.js';

// outside: a meter hands back the one instrument it holds for a name however often it is asked, and drops an attribute whose value is undefined.
/** Records through the global OpenTelemetry MeterProvider, a no-op until `@jterrazz/telemetry/register` registers one; `namespace` prefixes every name. */
export class OtelMetricsAdapter<
    TMetrics extends TelemetryMetrics = TelemetryMetrics,
> implements MetricsPort<TMetrics> {
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
        this.meter.createCounter(this.qualify(name)).add(options?.value ?? 1, options?.attributes);
    }

    gauge<TName extends keyof TMetrics & string>(
        name: TName,
        value: number,
        options?: MetricsRecordOptions<TMetrics[TName]>,
    ): void {
        this.meter.createGauge(this.qualify(name)).record(value, options?.attributes);
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
        this.meter.createHistogram(this.qualify(name)).record(value, options?.attributes);
    }

    private qualify(name: string): string {
        if (this.namespace === undefined || this.namespace === '') {
            return name;
        }

        return `${this.namespace}.${name}`;
    }
}
