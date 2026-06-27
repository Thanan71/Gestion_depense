import { URL, fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import type { PluginOption } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const plugins: PluginOption[] = [vue()]

  if (env.VITE_ENABLE_PWA === 'true') {
    plugins.push(
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['robots.txt', 'pwa/apple-touch-icon.png'],
        manifest: {
          name: 'Gestion dépense',
          short_name: 'Dépenses',
          description: 'Suivi local des dépenses, revenus, budgets et objectifs.',
          lang: 'fr',
          theme_color: '#0f766e',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/pwa/maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/.netlify/functions/'),
              handler: 'NetworkOnly',
              options: {
                cacheName: 'api-network-only'
              }
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 30 * 24 * 60 * 60
                }
              }
            }
          ]
        }
      })
    )
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
})
