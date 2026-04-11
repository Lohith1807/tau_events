import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://tauevent-management.vercel.app',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://tauevent-management.vercel.app',
        changeOrigin: true,
      }
    }
  }
});
