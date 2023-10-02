// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'miniflare',
    environmentOptions: {
      compatibilityFlags: [
        'transformstream_enable_standard_constructor',
        'streams_enable_constructors',
      ],
    },
  },
});
