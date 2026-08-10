import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Default to the fast node environment. Component tests that need a DOM
    // opt in per file with a `@vitest-environment jsdom` docblock, which keeps
    // pure-logic suites (geometry, SVG strings, serialisation) off jsdom.
    environment: 'node',
  },
});
