import { LoggerLevelSchema } from '@jterrazz/telemetry';

console.log(`levels: ${LoggerLevelSchema.options.join(', ')}`);
for (const candidate of ['debug', 'silent', 'verbose', 'INFO']) {
    const parsed = LoggerLevelSchema.safeParse(candidate);
    console.log(`${candidate}: ${parsed.success ? 'accepted' : 'refused'}`);
}
