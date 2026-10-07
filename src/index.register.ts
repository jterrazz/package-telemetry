/**
 * OpenTelemetry SDK entry point, loaded before the application:
 *
 * `node --import @jterrazz/telemetry/register dist/index.js`
 *
 * Everything is configured from OTEL_* environment variables — on the
 * jterrazz K8s app chart they are injected automatically, so this line is
 * the entire setup.
 */
import { registerTelemetry } from './register/initialize.js';

await registerTelemetry();

export { registerTelemetry } from './register/initialize.js';
