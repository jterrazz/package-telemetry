# Migrate from @jterrazz/logger

`@jterrazz/telemetry` absorbed `@jterrazz/logger`: `LoggerPort`, `LoggerLevel`, `PinoLoggerAdapter` and `NoopLoggerAdapter` keep their names and shapes, so a service moves by changing the import:

```diff
-import { type LoggerPort, PinoLoggerAdapter } from '@jterrazz/logger';
+import { type LoggerPort, PinoLoggerAdapter } from '@jterrazz/telemetry';
```

`PinoLoggerAdapter` no longer takes `prettyPrint`: development output is `PrettyLoggerAdapter`'s, and `createLogger()` picks between the two from `NODE_ENV` ([Adapters](../reference/adapters.md)).

## Related

- [Adapters](../reference/adapters.md): every logger adapter, and what `createLogger()` chooses.
