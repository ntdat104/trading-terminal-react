import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 4200,
    open: true,
    host: true,
    proxy: {
      // Mỗi khi gọi API bắt đầu bằng '/api-dnse', Vite sẽ chuyển tiếp sang domain DNSE
      '/api-dnse': {
        target: 'https://api.dnse.com.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-dnse/, ''),
      },
    },
  },
  preview: {
    port: 8080,
    open: true,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id
              .toString()
              .split('node_modules/')[1]
              .split('/')[0]
              .toString();
          }
        },
      },
    },
  },
});
