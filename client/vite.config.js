import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development React runs on :5173 and API calls are forwarded to Express on :5000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
