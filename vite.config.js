import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/nvidia': {
        target: 'https://integrate.api.nvidia.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nvidia/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Authorization', 'Bearer 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');
          });
        }
      },
      '/api/tts': {
        target: 'https://877104f7-e885-42b9-8de8-f6e4c6303969.invocation.api.nvcf.nvidia.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying TTS request:', proxyReq.method, proxyReq.path);
            proxyReq.setHeader('Authorization', 'Bearer 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');
          });
        }
      },
    },
  },
})
