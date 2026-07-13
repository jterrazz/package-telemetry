import { logs } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

let initialized = false;

/**
 * Parse OTLP headers from the standard "Key1=Value1,Key2=Value2" format
 */
function parseHeaders(headerString?: string): Record<string, string> | undefined {
    if (!headerString) {
        return undefined;
    }

    const headers: Record<string, string> = {};
    for (const pair of headerString.split(',')) {
        const eqIndex = pair.indexOf('=');
        if (eqIndex > 0) {
            headers[pair.substring(0, eqIndex).trim()] = decodeURIComponent(
                pair.substring(eqIndex + 1).trim(),
            );
        }
    }
    return headers;
}

/**
 * Initialize the OpenTelemetry SDK from the environment (12-factor):
 * - OTEL_EXPORTER_OTLP_ENDPOINT — collector endpoint; absent = telemetry off
 * - OTEL_SERVICE_NAME / OTEL_RESOURCE_ATTRIBUTES — identity, injected by infra
 * - OTEL_SDK_DISABLED=true — hard kill switch
 *
 * Registers auto-instrumentation (traces + metrics over OTLP) and a global
 * LoggerProvider used by OtelLoggerAdapter for OTLP log export.
 *
 * Idempotent. Runs automatically when loaded via:
 * `node --import @jterrazz/telemetry/register dist/index.js`
 */
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
    if (!endpoint) {
        console.info('[Telemetry] No OTEL_EXPORTER_OTLP_ENDPOINT configured, export disabled');
        return;
    }

    const serviceName = process.env.OTEL_SERVICE_NAME ?? 'unknown-service';

    // Exporter selection read by auto-instrumentations at import time.
    // Logs go through the LoggerProvider below instead (dual-emit adapter).
    process.env.OTEL_TRACES_EXPORTER ??= 'otlp';
    process.env.OTEL_METRICS_EXPORTER ??= 'otlp';
    process.env.OTEL_LOGS_EXPORTER ??= 'none';
    process.env.OTEL_NODE_RESOURCE_DETECTORS ??= 'env,host,os';

    // Parse deployment environment from OTEL_RESOURCE_ATTRIBUTES (injected by infra)
    const resourceAttributes = process.env.OTEL_RESOURCE_ATTRIBUTES ?? '';
    const environmentMatch = resourceAttributes.match(
        /deployment\.environment=(?<environment>[^,]+)/,
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

    // Register auto-instrumentation for traces and metrics
    await import('@opentelemetry/auto-instrumentations-node/register');

    console.info('[Telemetry] Initialized', {
        endpoint,
        environment: deploymentEnvironment,
        serviceName,
    });
}
