import { metrics } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import type { Resource } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { format } from 'node:util';

let initialized = false;

const report = (...parts: unknown[]): void => {
    process.stdout.write(`${format('[Telemetry]', ...parts)}\n`);
};

// outside: OTLP headers are written `Key1=Value1,Key2=Value2`, each value URL-encoded.
function parseHeaders(headerString?: string): Record<string, string> {
    const headers: Record<string, string> = {};

    if (headerString === undefined || headerString === '') {
        return headers;
    }

    for (const pair of headerString.split(',')) {
        const eqIndex = pair.indexOf('=');
        if (eqIndex > 0) {
            headers[pair.slice(0, eqIndex).trim()] = decodeURIComponent(
                pair.slice(eqIndex + 1).trim(),
            );
        }
    }
    return headers;
}

function deploymentEnvironmentOf(resourceAttributes: string): string {
    const environmentMatch = /deployment\.environment=(?<environment>[^,]+)/u.exec(
        resourceAttributes,
    );

    return environmentMatch?.groups?.environment ?? process.env.NODE_ENV ?? 'development';
}

function registerLogs(endpoint: string, resource: Resource): void {
    const exporter = new OTLPLogExporter({
        headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
        url: `${endpoint}/v1/logs`,
    });

    logs.setGlobalLoggerProvider(
        new LoggerProvider({
            processors: [
                new BatchLogRecordProcessor(exporter, {
                    maxExportBatchSize: 100,
                    scheduledDelayMillis: 1000,
                }),
            ],
            resource,
        }),
    );
}

// hazard: without a registered MeterProvider every getMeter() resolves to the global no-op, and every instrument emits nothing.
function registerMetrics(endpoint: string, resource: Resource): void {
    const exporter = new OTLPMetricExporter({
        headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
        url: `${endpoint}/v1/metrics`,
    });

    metrics.setGlobalMeterProvider(
        new MeterProvider({
            readers: [
                new PeriodicExportingMetricReader({ exportIntervalMillis: 15_000, exporter }),
            ],
            resource,
        }),
    );
}

/** Starts the OpenTelemetry SDK from the OTEL_* environment, once: traces by auto-instrumentation, logs and metrics through the global providers; no OTEL_EXPORTER_OTLP_ENDPOINT, or OTEL_SDK_DISABLED=true, exports nothing. */
export async function registerTelemetry(): Promise<void> {
    if (initialized) {
        return;
    }
    initialized = true;

    if (process.env.OTEL_SDK_DISABLED === 'true') {
        report('Disabled by OTEL_SDK_DISABLED');
        return;
    }

    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    if (endpoint === undefined || endpoint === '') {
        report('No OTEL_EXPORTER_OTLP_ENDPOINT configured, export disabled');
        return;
    }

    const serviceName = process.env.OTEL_SERVICE_NAME ?? 'unknown-service';

    // hazard: auto-instrumentation reads these as it is imported; logs and metrics go through the providers registered here instead, since its own SDK would leave getMeter() on the global no-op.
    process.env.OTEL_TRACES_EXPORTER ??= 'otlp';
    process.env.OTEL_METRICS_EXPORTER ??= 'none';
    process.env.OTEL_LOGS_EXPORTER ??= 'none';
    process.env.OTEL_NODE_RESOURCE_DETECTORS ??= 'env,host,os';

    const environment = deploymentEnvironmentOf(process.env.OTEL_RESOURCE_ATTRIBUTES ?? '');
    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: serviceName,
        'deployment.environment': environment,
    });

    registerLogs(endpoint, resource);
    registerMetrics(endpoint, resource);

    await import('@opentelemetry/auto-instrumentations-node/register');

    report('Initialized', { endpoint, environment, serviceName });
}
