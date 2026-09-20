import { describe, expect, test } from 'vitest';

import { OtelMetricsAdapter } from '../adapters/metrics/otel-metrics.adapter.js';
import { createMetrics } from './create-metrics.js';

describe('createMetrics', () => {
    test('should build an OTel-backed metrics recorder', () => {
        // Given - a namespace
        // Then - an OTel-backed metrics recorder is returned
        expect(createMetrics({ namespace: 'app' })).toBeInstanceOf(OtelMetricsAdapter);
    });

    test('should accept base metrics extended with app metrics', () => {
        // Given - a typed catalogue extending the base metrics
        type AppMetrics = {
            'articles.processed': { source: string };
            'task.started': { task: string };
        };
        const metrics = createMetrics<AppMetrics>({ namespace: 'signews' });

        // Then - every metric of the catalogue is recorded without a compile-time or runtime error
        expect(() => {
            metrics.counter('articles.processed', { attributes: { source: 'worldnews' } });
            metrics.counter('task.started', { attributes: { task: 'pipeline' } });
        }).not.toThrow();
    });
});
