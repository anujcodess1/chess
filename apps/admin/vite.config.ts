import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { matchmakingPlugin } from './src/server/matchmakingPlugin';

export default defineConfig({
  plugins: [react(), matchmakingPlugin()],
  server: {
    port: 5175,
    host: true,
  },
  preview: {
    port: 5175,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
