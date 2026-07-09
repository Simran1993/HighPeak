import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // sockjs-client expects `global` to exist (Node-ism)
    global: 'window',
  },
  server: {
    port: 5173,
  },
});
