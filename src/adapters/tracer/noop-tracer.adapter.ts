import type { TelemetryAttributes } from '../../ports/telemetry.port.js';
import type { TracerPort, TracerSpanOptions } from '../../ports/tracer.port.js';

/**
 * No-op tracer adapter: spans execute their function directly, events and
 * attributes are dropped. Useful for tests.
 */
export class NoopTracerAdapter implements TracerPort {
    event(_name: string, _attributes?: TelemetryAttributes): void {
        // No operation
    }

    setAttribute(_key: string, _value: boolean | number | string): void {
        // No operation
    }

    async span<T>(_name: string, fn: () => Promise<T>, _options?: TracerSpanOptions): Promise<T> {
        return fn();
    }
}
