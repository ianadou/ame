import pkg from './package.json'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  components: [{ path: '~/components', pathPrefix: false }],
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint'],
  typescript: { strict: true },
  // Une seule source de version : package.json, que Tauri lit aussi pour
  // numéroter l'installeur. Le footer l'affiche sans copie à tenir à jour.
  runtimeConfig: { public: { version: pkg.version } },
  app: {
    head: {
      title: 'AME · Gestion de stock BTP',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'alternate icon', type: 'image/png', href: '/icon-256.png' },
      ],
    },
  },
})
