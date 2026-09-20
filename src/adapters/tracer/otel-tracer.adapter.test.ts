import { context, SpanStatusCode, trace } from '@opentelemetry/api';
import type { Span } from '@opentelemetry/api';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { OtelTracerAdapter } from './otel-tracer.adapter.js';

function registerFakeTracerProvider() {
    const span = {
        addEvent: vi.fn<Span['addEvent']>(),
        end: vi.fn<Span['end']>(),
        recordException: vi.fn<Span['recordException']>(),
        setAttribute: vi.fn<Span['setAttribute']>(),
        setStatus: vi.fn<Span['setStatus']>(),
    };
    const tracer = {
        startActiveSpan: vi.fn<
            (name: string, options: unknown, fn: (span: Span) => unknown) => unknown
        >((_name, _options, fn) => fn(span as unknown as Span)),
    };
    trace.setGlobalTracerProvider({
        getTracer: () => tracer,
    } as never);
    return { span, tracer };
}

describe('otelTracerAdapter', () => {
    afterEach(() => {
        trace.disable();
        context.disable();
    });

    test('should run the function inside a span and mark it OK', async () => {
        // Given - a registered tracer provider and a fresh adapter
        const fake = registerFakeTracerProvider();
        const tracer = new OtelTracerAdapter();

        // When
        const result = await tracer.span('pipeline.run', async () => 'done', {
            attributes: { stage: 'ingest' },
        });

        // Then - the function's result is returned and the span is marked OK
        expect(result).toBe('done');
        expect(fake.tracer.startActiveSpan).toHaveBeenCalledWith(
            'pipeline.run',
            { attributes: { stage: 'ingest' } },
            expect.any(Function),
        );
        expect(fake.span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
        expect(fake.span.end).toHaveBeenCalledWith();
    });

    test('should record the error, mark the span failed and rethrow', async () => {
        // Given - a registered tracer provider, a fresh adapter and a failing function
        const fake = registerFakeTracerProvider();
        const tracer = new OtelTracerAdapter();
        const failure = new Error('boom');

        // Then - the error is rethrown, recorded and the span is marked failed
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
        expect(fake.span.end).toHaveBeenCalledWith();
    });

    test('should qualify span names with the namespace', async () => {
        // Given - an adapter configured with a namespace
        const fake = registerFakeTracerProvider();
        const tracer = new OtelTracerAdapter({ namespace: 'signews' });

        // When
        await tracer.span('pipeline.run', async () => {});

        // Then - the span name is prefixed with the namespace
        expect(fake.tracer.startActiveSpan).toHaveBeenCalledWith(
            'signews.pipeline.run',
            { attributes: {} },
            expect.any(Function),
        );
    });

    test('should drop events and attributes without an active span', () => {
        // Given - an adapter with no tracer provider registered
        const tracer = new OtelTracerAdapter();

        // Then - recording an event or an attribute is a safe no-op
        expect(() => {
            tracer.event('cache.miss', { key: 'a' });
            tracer.setAttribute('user.id', 42);
        }).not.toThrow();
    });
});
