import { metrics } from '@opentelemetry/api';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { OtelMetricsAdapter } from '../otel-metrics.adapter.js';

function registerFakeMeterProvider() {
    const counter = { add: vi.fn() };
    const gauge = { record: vi.fn() };
    const histogram = { record: vi.fn() };
    const meter = {
        createCounter: vi.fn(() => counter),
        createGauge: vi.fn(() => gauge),
        createHistogram: vi.fn(() => histogram),
    };
    metrics.setGlobalMeterProvider({
        getMeter: () => meter,
    } as never);
    return { counter, gauge, histogram, meter };
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
