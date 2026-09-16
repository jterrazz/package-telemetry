import type {
    MetricsCounterOptions,
    MetricsObserve,
    MetricsPort,
    MetricsRecordOptions,
    TelemetryMetrics,
} from '../../ports/metrics.port.js';

/**
 * No-op metrics adapter that implements MetricsPort but records nothing.
 * Useful for tests.
 */
export class NoopMetricsAdapter<
    TMetrics extends TelemetryMetrics = TelemetryMetrics,
> implements MetricsPort<TMetrics> {
    counter<TName extends keyof TMetrics & string>(
        _name: TName,
        _options?: MetricsCounterOptions<TMetrics[TName]>,
    ): void {
        // No operation
    }

    gauge<TName extends keyof TMetrics & string>(
        _name: TName,
        _value: number,
        _options?: MetricsRecordOptions<TMetrics[TName]>,
    ): void {
        // No operation
    }

    histogram<TName extends keyof TMetrics & string>(
        _name: TName,
        _value: number,
        _options?: MetricsRecordOptions<TMetrics[TName]>,
    ): void {
        // No operation
    }

    observableGauge<TName extends keyof TMetrics & string>(
        _name: TName,
        _callback: (observe: MetricsObserve<TMetrics[TName]>) => void,
    ): void {
        // No operation
    }
}
