import { describe, expect, test } from 'vitest';

import { OtelTracerAdapter } from '../adapters/tracer/otel-tracer.adapter.js';
import { createTracer } from './create-tracer.js';

describe('createTracer', () => {
    test('should build an OTel-backed tracer', () => {
        // Given - a namespace
        // Then - an OTel-backed tracer is returned
        expect(createTracer({ namespace: 'app' })).toBeInstanceOf(OtelTracerAdapter);
    });
});
