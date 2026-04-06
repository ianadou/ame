export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint'],
  typescript: { strict: true },
  app: {
    head: {
      title: 'AME — Gestion de stock',
    },
  },
})
