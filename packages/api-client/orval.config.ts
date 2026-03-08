// orval.config.ts
import { defineConfig } from 'orval';

export default defineConfig({
  wiraApi: {
    input: {
      target: './openapi/openapi.json',
    },
    output: {
      mode: 'single',
      target: './src/generated/api-client.ts',
      client: 'react-query',
      clean: true,
      prettier: true,
    },
  },
});
