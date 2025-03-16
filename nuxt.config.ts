// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  runtimeConfig: {
    dbUri: "",
    githubClientSecret: '',
    githubClientId: '',
    googleClientSecret: '',
    googleClientId: '',
    gemini: '',
    appwrite: ''
  },

  modules: ["@nuxtjs/tailwindcss", 'nuxt-cron'],
  cron: {
    runOnInit: true
  }
})
