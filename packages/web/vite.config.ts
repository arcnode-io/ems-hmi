import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import reactNativeWeb from 'vite-plugin-react-native-web'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    reactNativeWeb(),
  ],
  define: {
    global: 'globalThis',
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  resolve: {
    alias: {
      'react-native-linear-gradient': 'react-native-web-linear-gradient',
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  server: {
    proxy: {
      // Mirrors nginx's real-deployment role: RealMqttProvider derives
      // ws(s)://<page-origin>/mqtt by convention when the broker-creds
      // response ships an empty `url` (see brokerUrl.ts). Dev-server-only;
      // never touches the production build.
      '/mqtt': {
        target: 'ws://localhost:9001',
        ws: true,
      },
      // Same reasoning as /mqtt above — a real deployment reaches
      // device-api same-origin via nginx (no CORS needed there either);
      // proxying here for local beta-mode testing instead of asking the
      // backend to loosen CORS for a cross-origin case that never exists
      // in production.
      '/device-api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/device-api/, ''),
      },
    },
  },
})