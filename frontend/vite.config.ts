import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://nanoshop.iongeyser.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1.0'),
      },
      '/product_images': {
        target: 'https://nanoshop.iongeyser.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
