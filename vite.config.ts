import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // API 请求代理到后端
      '/api': {
        target: 'http://localhost:8010',
        changeOrigin: true,
      },
      // 图库静态文件代理
      '/gallery': {
        target: 'http://localhost:8010',
        changeOrigin: true,
      },
    },
  },
});
