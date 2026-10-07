import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const CHECKOUT = resolve(import.meta.dirname, '../../../..');

const PACKAGE_NAME = '@jterrazz/telemetry';

let unpacked: string | undefined;

function packedPackage(): string {
    if (unpacked === undefined) {
        const into = mkdtempSync(join(tmpdir(), 'telemetry-packed-'));
        process.once('exit', () => {
            rmSync(into, { force: true, recursive: true });
        });
        const filename = execFileSync(
            'npm',
            ['pack', '--ignore-scripts', '--silent', '--pack-destination', into],
            { cwd: CHECKOUT, encoding: 'utf8' },
        ).trim();
        execFileSync('tar', ['-xzf', join(into, filename), '-C', into]);
        unpacked = join(into, 'package');
    }

    return unpacked;
}

function dependenciesOf(directory: string): string[] {
    const manifest: unknown = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
    const dependencies =
        typeof manifest === 'object' && manifest !== null && 'dependencies' in manifest
            ? manifest.dependencies
            : {};

    return typeof dependencies === 'object' && dependencies !== null
        ? Object.keys(dependencies)
        : [];
}

/** Installs the tarball `npm pack` writes into the working directory as a consumer's install lays it: the package beside what its `dependencies` reach, never the checkout's whole install. */
export function installPacked(workdir: string): void {
    const modules = join(workdir, 'node_modules');
    const packed = packedPackage();
    cpSync(packed, join(modules, PACKAGE_NAME), { recursive: true });
    for (const dependency of dependenciesOf(packed)) {
        const link = join(modules, dependency);
        mkdirSync(dirname(link), { recursive: true });
        symlinkSync(join(CHECKOUT, 'node_modules', dependency), link);
    }
}
