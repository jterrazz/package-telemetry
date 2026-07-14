import { metrics } from '@opentelemetry/api';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { OtelMetricsAdapter } from '../otel-metrics.adapter.js';

function registerFakeMeterProvider() {
    const counter = { add: vi.fn() };
    const gauge = { record: vi.fn() };
    const histogram = { record: vi.fn() };
    const observableCallbacks: ((result: {
        observe: (value: number, attributes?: Record<string, unknown>) => void;
    }) => void)[] = [];
    const observableGauge = {
        addCallback: vi.fn((callback: (typeof observableCallbacks)[number]) => {
            observableCallbacks.push(callback);
        }),
    };
    const meter = {
        createCounter: vi.fn(() => counter),
        createGauge: vi.fn(() => gauge),
        createHistogram: vi.fn(() => histogram),
        createObservableGauge: vi.fn(() => observableGauge),
    };
    metrics.setGlobalMeterProvider({
        getMeter: () => meter,
    } as never);
    return { counter, gauge, histogram, meter, observableCallbacks, observableGauge };
}

describe('OtelMetricsAdapter', () => {
    afterEach(() => {
        metrics.disable();
    });

    test('should increment a counter with default value 1', () => {
        // Given
        const fake = registerFakeMeterProvider();
        const adapter = new OtelMetricsAdapter();

        // When
        adapter.counter('task.started', { attributes: { task: 'pipeline' } });

        // Then
        expect(fake.meter.createCounter).toHaveBeenCalledWith('task.started');
        expect(fake.counter.add).toHaveBeenCalledWith(1, { task: 'pipeline' });
    });

    test('should qualify metric names with the namespace', () => {
        // Given
        const fake = registerFakeMeterProvider();
        const adapter = new OtelMetricsAdapter({ namespace: 'signews' });

        // When
        adapter.counter('task.started', { attributes: { task: 'pipeline' } });
        adapter.histogram('task.duration', 125, { attributes: { task: 'pipeline' } });
        adapter.gauge('queue.depth', 7);

        // Then
        expect(fake.meter.createCounter).toHaveBeenCalledWith('signews.task.started');
        expect(fake.meter.createHistogram).toHaveBeenCalledWith('signews.task.duration');
        expect(fake.meter.createGauge).toHaveBeenCalledWith('signews.queue.depth');
    });

    test('should reuse instruments across calls', () => {
        // Given
        const fake = registerFakeMeterProvider();
        const adapter = new OtelMetricsAdapter();

        // When
        adapter.counter('task.completed', { attributes: { task: 'a' } });
        adapter.counter('task.completed', { attributes: { task: 'b' }, value: 3 });

        // Then
        expect(fake.meter.createCounter).toHaveBeenCalledTimes(1);
        expect(fake.counter.add).toHaveBeenCalledWith(1, { task: 'a' });
        expect(fake.counter.add).toHaveBeenCalledWith(3, { task: 'b' });
    });

    test('should strip undefined attribute values', () => {
        // Given
        const fake = registerFakeMeterProvider();
        const adapter = new OtelMetricsAdapter();

        // When
        adapter.counter('task.failed', { attributes: { reason: undefined, task: 'x' } });

        // Then
        expect(fake.counter.add).toHaveBeenCalledWith(1, { task: 'x' });
    });

    test('should observe values with attributes through an observable gauge', () => {
        // Given
        const fake = registerFakeMeterProvider();
        const adapter = new OtelMetricsAdapter({ namespace: 'app' });

        // When — register, then simulate an export-interval collection
        adapter.observableGauge('eventloop.lag.ms', (observe) => {
            observe(1.5, { stat: 'mean' });
            observe(9.9, { stat: 'p99' });
        });
        const observe = vi.fn();
        for (const callback of fake.observableCallbacks) {
            callback({ observe });
        }

        // Then
        expect(fake.meter.createObservableGauge).toHaveBeenCalledWith('app.eventloop.lag.ms');
        expect(observe).toHaveBeenCalledWith(1.5, { stat: 'mean' });
        expect(observe).toHaveBeenCalledWith(9.9, { stat: 'p99' });
    });

    test('should ignore duplicate observable gauge registrations', () => {
        // Given
        const fake = registerFakeMeterProvider();
        const adapter = new OtelMetricsAdapter();

        // When
        adapter.observableGauge('queue.depth', () => undefined);
        adapter.observableGauge('queue.depth', () => undefined);

        // Then
        expect(fake.meter.createObservableGauge).toHaveBeenCalledTimes(1);
        expect(fake.observableGauge.addCallback).toHaveBeenCalledTimes(1);
    });

    test('should be a safe no-op without a registered SDK', () => {
        // Given
        const adapter = new OtelMetricsAdapter({ namespace: 'app' });

        // When / Then
        expect(() => {
            adapter.counter('task.started', { attributes: { task: 'noop' } });
            adapter.gauge('queue.depth', 1);
            adapter.histogram('task.duration', 10);
        }).not.toThrow();
    });
});
