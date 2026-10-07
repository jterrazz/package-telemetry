import { metrics } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

let initialized = false;

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

/** Starts the OpenTelemetry SDK from the OTEL_* environment, once: traces by auto-instrumentation, logs and metrics through the global providers; no OTEL_EXPORTER_OTLP_ENDPOINT, or OTEL_SDK_DISABLED=true, exports nothing. */
export async function registerTelemetry(): Promise<void> {
    if (initialized) {
        return;
    }
    initialized = true;

    if (process.env.OTEL_SDK_DISABLED === 'true') {
        console.info('[Telemetry] Disabled by OTEL_SDK_DISABLED');
        return;
    }

    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    if (endpoint === undefined || endpoint === '') {
        console.info('[Telemetry] No OTEL_EXPORTER_OTLP_ENDPOINT configured, export disabled');
        return;
    }

    const serviceName = process.env.OTEL_SERVICE_NAME ?? 'unknown-service';

    // hazard: auto-instrumentation reads these as it is imported; logs and metrics go through the providers registered here instead, since its own SDK would leave getMeter() on the global no-op.
    process.env.OTEL_TRACES_EXPORTER ??= 'otlp';
    process.env.OTEL_METRICS_EXPORTER ??= 'none';
    process.env.OTEL_LOGS_EXPORTER ??= 'none';
    process.env.OTEL_NODE_RESOURCE_DETECTORS ??= 'env,host,os';

    const resourceAttributes = process.env.OTEL_RESOURCE_ATTRIBUTES ?? '';
    const environmentMatch = /deployment\.environment=(?<environment>[^,]+)/u.exec(
        resourceAttributes,
    );
    const deploymentEnvironment =
        environmentMatch?.groups?.environment ?? process.env.NODE_ENV ?? 'development';

    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: serviceName,
        'deployment.environment': deploymentEnvironment,
    });

    const logExporter = new OTLPLogExporter({
        headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
        url: `${endpoint}/v1/logs`,
    });

    const loggerProvider = new LoggerProvider({
        processors: [
            new BatchLogRecordProcessor(logExporter, {
                maxExportBatchSize: 100,
                scheduledDelayMillis: 1000,
            }),
        ],
        resource,
    });

    logs.setGlobalLoggerProvider(loggerProvider);

    // hazard: without a registered MeterProvider every getMeter() resolves to the global no-op, and every instrument emits nothing.
    const metricExporter = new OTLPMetricExporter({
        headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
        url: `${endpoint}/v1/metrics`,
    });

    const meterProvider = new MeterProvider({
        readers: [
            new PeriodicExportingMetricReader({
                exportIntervalMillis: 15_000,
                exporter: metricExporter,
            }),
        ],
        resource,
    });

    metrics.setGlobalMeterProvider(meterProvider);

    await import('@opentelemetry/auto-instrumentations-node/register');

    console.info('[Telemetry] Initialized', {
        endpoint,
        environment: deploymentEnvironment,
        serviceName,
    });
}
