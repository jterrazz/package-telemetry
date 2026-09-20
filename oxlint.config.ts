import { testing } from '@jterrazz/test/oxlint';
import { compose, defineConfig, library } from '@jterrazz/typescript/oxlint';
import type { OxlintConfig } from '@jterrazz/typescript/oxlint';

const config: OxlintConfig = defineConfig(compose(library, testing));

export default config;
