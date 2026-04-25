import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import devServer from '@hono/vite-dev-server';

import cloudflareAdapter from '@hono/vite-dev-server/cloudflare';

export default defineConfig({
  plugins: [
    react(),
    devServer({
      entry: 'src/server/index.ts',
      adapter: cloudflareAdapter,
      exclude: [
        /^\/(?!api|auth).*/  // /api と /auth から始まらないすべてのリクエストを除外（Viteが処理）
      ],
      injectClientScript: false
    }),
  ],
  server: {
    port: 3000
  }
});
