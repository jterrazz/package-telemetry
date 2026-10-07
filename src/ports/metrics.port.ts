import type { TelemetryAttributes } from './telemetry.port.js';

// outside: OpenTelemetry names a metric in lowercase dot.case ('task.started'); the application's domain is no part of the name — the adapter's `namespace` prefixes every one ('{namespace}.{name}').

/** hazard: a catalogue declared as an interface has no implicit index signature and fails this constraint — declare it as a type alias, `TelemetryBaseMetrics & { … }`. */
export type TelemetryMetrics = Record<string, TelemetryAttributes>;

/** The task lifecycle every service emits, so one dashboard reads them all: `task.duration` is a histogram in milliseconds, the others are counters. */
export type TelemetryBaseMetrics = {
    'task.completed': { task: string };
    'task.duration': { task: string };
    'task.failed': { reason?: string; task: string };
    'task.started': { task: string };
};

export type MetricsCounterOptions<TAttributes extends TelemetryAttributes = TelemetryAttributes> = {
    attributes?: TAttributes;
    /** Increment step (defaults to 1) */
    value?: number;
};

export type MetricsPort<TMetrics extends TelemetryMetrics = TelemetryMetrics> = {
    counter: <TName extends keyof TMetrics & string>(
        name: TName,
        options?: MetricsCounterOptions<TMetrics[TName]>,
    ) => void;

    /** Records the current value of a level, such as a queue's depth. */
    gauge: <TName extends keyof TMetrics & string>(
        name: TName,
        value: number,
        options?: MetricsRecordOptions<TMetrics[TName]>,
    ) => void;

    histogram: <TName extends keyof TMetrics & string>(
        name: TName,
        value: number,
        options?: MetricsRecordOptions<TMetrics[TName]>,
    ) => void;

    /** Samples a gauge once per export interval: `callback` may observe several values, and a second registration of a name is ignored. */
    observableGauge: <TName extends keyof TMetrics & string>(
        name: TName,
        callback: (observe: MetricsObserve<TMetrics[TName]>) => void,
    ) => void;
};

export type MetricsObserve<TAttributes extends TelemetryAttributes = TelemetryAttributes> = (
    value: number,
    attributes?: TAttributes,
) => void;

export type MetricsRecordOptions<TAttributes extends TelemetryAttributes = TelemetryAttributes> = {
    attributes?: TAttributes;
};
