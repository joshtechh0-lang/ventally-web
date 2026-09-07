import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Workbox SW must not replace firebase-messaging-sw.js as the FCM push handler
      injectRegister: false,
      includeAssets: ['apple-touch-icon.png', 'logo-192.png', 'logo-512.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000 // 5 MB
      },
      manifest: {
        name: 'Ventally',
        short_name: 'Ventally',
        description: 'A platform for mental health support and conversations',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@reduxjs') || id.includes('react-redux')) {
              return 'redux-vendor';
            }
            if (id.includes('i18next')) {
              return 'i18n-vendor';
            }
            if (id.includes('lucide-react') || id.includes('react-toastify')) {
              return 'ui-vendor';
            }
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
})
