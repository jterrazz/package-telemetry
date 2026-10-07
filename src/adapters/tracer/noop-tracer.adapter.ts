import type { TelemetryAttributes } from '../../ports/telemetry.port.js';
import type { TracerPort, TracerSpanOptions } from '../../ports/tracer.port.js';

/** A TracerPort whose spans run their function bare and drop every event and attribute — for tests. */
export class NoopTracerAdapter implements TracerPort {
    event(_name: string, _attributes?: TelemetryAttributes): void {}

    setAttribute(_key: string, _value: boolean | number | string): void {}

    async span<T>(_name: string, fn: () => Promise<T>, _options?: TracerSpanOptions): Promise<T> {
        return await fn();
    }
}
