import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
  base: './',
  plugins: [VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon.svg', 'icons/*.png'],
    manifest: {
      id: '/photo-to-text/', name: '写真から文字', short_name: '写真から文字',
      description: '写真の文字を読み取ります。Photo to Text: turn a photo of notes into text.',
      lang: 'ja', start_url: './', scope: './', display: 'standalone', orientation: 'portrait',
      background_color: '#f4f0ec', theme_color: '#7d8f78',
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      navigateFallback: 'index.html', cleanupOutdatedCaches: true,
      runtimeCaching: [{ urlPattern: /^https:\/\/(cdn\.jsdelivr\.net|tessdata\.projectnaptha\.com)\//, handler: 'CacheFirst',
        options: { cacheName: 'ocr', expiration: { maxEntries: 30 }, cacheableResponse: { statuses: [0, 200] } } }],
    },
  })],
})
