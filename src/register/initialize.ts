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

function deploymentEnvironmentOf(resourceAttributes: string): string {
    const { environment } =
        /deployment\.environment=(?<environment>[^,]+)/u.exec(resourceAttributes)?.groups ?? {};

    return environment ?? process.env.NODE_ENV ?? 'development';
}

// outside: an OTLP exporter reads its endpoint and its headers from OTEL_EXPORTER_OTLP_ENDPOINT and OTEL_EXPORTER_OTLP_HEADERS itself, appending the signal's path.
function registerLogs(resource: Resource): void {
    const exporter = new OTLPLogExporter();

    logs.setGlobalLoggerProvider(
        new LoggerProvider({
            processors: [
                // Stryker disable next-line ObjectLiteral: the batch's size and delay decide when a record leaves, never what leaves
                new BatchLogRecordProcessor({
                    exporter,
                    maxExportBatchSize: 100,
                    scheduledDelayMillis: 1000,
                }),
            ],
            resource,
        }),
    );
}

// hazard: without a registered MeterProvider every getMeter() resolves to the global no-op, and every instrument emits nothing.
function registerMetrics(resource: Resource): void {
    const exporter = new OTLPMetricExporter();

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
    // Stryker disable AssignmentOperator,StringLiteral: the SDK's own logs and metrics providers would register after these and lose the global, and otlp is its default trace exporter: the collector receives the same signals either way
    process.env.OTEL_TRACES_EXPORTER ??= 'otlp';
    process.env.OTEL_METRICS_EXPORTER ??= 'none';
    process.env.OTEL_LOGS_EXPORTER ??= 'none';
    // Stryker restore AssignmentOperator,StringLiteral
    process.env.OTEL_NODE_RESOURCE_DETECTORS ??= 'env,host,os';

    // Stryker disable next-line StringLiteral: an absent variable and a text naming no deployment fall back alike
    const environment = deploymentEnvironmentOf(process.env.OTEL_RESOURCE_ATTRIBUTES ?? '');
    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: serviceName,
        'deployment.environment': environment,
    });

    registerLogs(resource);
    registerMetrics(resource);

    await import('@opentelemetry/auto-instrumentations-node/register');

    report('Initialized', { endpoint, environment, serviceName });
}
