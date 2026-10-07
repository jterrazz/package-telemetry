import type {
    MetricsCounterOptions,
    MetricsObserve,
    MetricsPort,
    MetricsRecordOptions,
    TelemetryMetrics,
} from '../../ports/metrics.port.js';

/** A MetricsPort that records nothing — for tests. */
export class NoopMetricsAdapter<
    TMetrics extends TelemetryMetrics = TelemetryMetrics,
> implements MetricsPort<TMetrics> {
    counter<TName extends keyof TMetrics & string>(
        _name: TName,
        _options?: MetricsCounterOptions<TMetrics[TName]>,
    ): void {}

    gauge<TName extends keyof TMetrics & string>(
        _name: TName,
        _value: number,
        _options?: MetricsRecordOptions<TMetrics[TName]>,
    ): void {}

    histogram<TName extends keyof TMetrics & string>(
        _name: TName,
        _value: number,
        _options?: MetricsRecordOptions<TMetrics[TName]>,
    ): void {}

    observableGauge<TName extends keyof TMetrics & string>(
        _name: TName,
        _sample: (observe: MetricsObserve<TMetrics[TName]>) => void,
    ): void {}
}
