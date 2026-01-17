import { resolve } from 'pathe'

export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  ssr: false,
  devtools: { enabled: false },
  app: { baseURL: '/__nuxthub' },
  css: ['~/assets/css/main.css'],
  nitro: { output: { publicDir: resolve(__dirname, '../../../dist/devtools-client') } }
})
