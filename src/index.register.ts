// outside: Node loads this entry before the application (`node --import @jterrazz/telemetry/register dist/index.js`), and the OTEL_* variables the app chart injects configure it.
import { registerTelemetry } from './register/initialize.js';

await registerTelemetry();

export { registerTelemetry } from './register/initialize.js';
