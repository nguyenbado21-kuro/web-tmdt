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
      '/api_vtp': {
        target: 'https://partner.viettelpost.vn/v2',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api_vtp/, ''),
      },
    },
  },
});
