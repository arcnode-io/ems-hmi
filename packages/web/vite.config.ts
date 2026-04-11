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
    include: ['@tamagui/portal', '@tamagui/select', '@tamagui/popover', 'buffer'],
  },
})