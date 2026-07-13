import { context, type Span, SpanStatusCode, trace } from '@opentelemetry/api';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { OtelTracerAdapter } from '../otel-tracer.adapter.js';

function registerFakeTracerProvider() {
    const span = {
        addEvent: vi.fn(),
        end: vi.fn(),
        recordException: vi.fn(),
        setAttribute: vi.fn(),
        setStatus: vi.fn(),
    };
    const tracer = {
        startActiveSpan: vi.fn((_name: string, _options: unknown, fn: (span: Span) => unknown) =>
            fn(span as unknown as Span),
        ),
    };
    trace.setGlobalTracerProvider({
        getTracer: () => tracer,
    } as never);
    return { span, tracer };
}

describe('OtelTracerAdapter', () => {
    afterEach(() => {
        trace.disable();
        context.disable();
    });

    test('should run the function inside a span and mark it OK', async () => {
        // Given
        const fake = registerFakeTracerProvider();
        const tracer = new OtelTracerAdapter();

        // When
        const result = await tracer.span('pipeline.run', async () => 'done', {
            attributes: { stage: 'ingest' },
        });

        // Then
        expect(result).toBe('done');
        expect(fake.tracer.startActiveSpan).toHaveBeenCalledWith(
            'pipeline.run',
            { attributes: { stage: 'ingest' } },
            expect.any(Function),
        );
        expect(fake.span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
        expect(fake.span.end).toHaveBeenCalled();
    });

    test('should record the error, mark the span failed and rethrow', async () => {
        // Given
        const fake = registerFakeTracerProvider();
        const tracer = new OtelTracerAdapter();
        const failure = new Error('boom');

        // When / Then
        await expect(
            tracer.span('pipeline.run', async () => {
                throw failure;
            }),
        ).rejects.toThrow('boom');
        expect(fake.span.setStatus).toHaveBeenCalledWith({
            code: SpanStatusCode.ERROR,
            message: 'boom',
        });
        expect(fake.span.recordException).toHaveBeenCalledWith(failure);
        expect(fake.span.end).toHaveBeenCalled();
    });

    test('should qualify span names with the namespace', async () => {
        // Given
        const fake = registerFakeTracerProvider();
        const tracer = new OtelTracerAdapter({ namespace: 'signews' });

        // When
        await tracer.span('pipeline.run', async () => undefined);

        // Then
        expect(fake.tracer.startActiveSpan).toHaveBeenCalledWith(
            'signews.pipeline.run',
            { attributes: {} },
            expect.any(Function),
        );
    });

    test('should drop events and attributes without an active span', () => {
        // Given
        const tracer = new OtelTracerAdapter();

        // When / Then
        expect(() => {
            tracer.event('cache.miss', { key: 'a' });
            tracer.setAttribute('user.id', 42);
        }).not.toThrow();
    });
});
