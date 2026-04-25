import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import devServer from '@hono/vite-dev-server';

export default defineConfig({
  plugins: [
    react(),
    devServer({
      entry: 'src/server/index.ts',
      exclude: [
        /.*\.tsx?($|\?)/,
        /.*\.(s?css|less)($|\?)/,
        /.*\.(svg|png)($|\?)/,
        /^\/@.+$/,
        /^\/favicon\.ico$/,
        /^\/(public|assets|static)\/.+/,
        /^\/src\/client\/.+/
      ],
      injectClientScript: false
    }),
  ],
  server: {
    port: 3000
  }
});
