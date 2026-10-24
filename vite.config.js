import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/aquifera-prototype/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // maplibre-gl ships as a pre-bundled single module (~1.1 MB) that cannot be internally split
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-maplibre', test: /node_modules[\\/]maplibre-gl[\\/]/, priority: 30 },
            { name: 'vendor-three', test: /node_modules[\\/]three[\\/]/, priority: 20 },
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|scheduler|lucide-react)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
