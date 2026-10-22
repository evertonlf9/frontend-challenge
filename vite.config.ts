import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { precompressedAssets } from './scripts/precompressed-assets.ts'
import { artworkHints } from './scripts/artwork-hints.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
  define: {
    'import.meta.env.VITE_ENABLE_MOCKS': JSON.stringify(env.VITE_ENABLE_MOCKS ?? 'true'),
  },
  plugins: [react(), tailwindcss(), artworkHints(), precompressedAssets()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  optimizeDeps: { include: ['axios', 'socket.io-client'] },
  build: {
    rolldownOptions: {
      output: { codeSplitting: { groups: [
        { name: 'framework', test: /node_modules[\\/](?:react|react-dom|scheduler|@tanstack)[\\/]/, priority: 20 },
        { name: 'ui', test: /node_modules[\\/](?:lucide-react|@radix-ui|class-variance-authority|clsx|tailwind-merge)[\\/]/, priority: 10 },
      ] } },
    },
  },
  }
})
