import { handleCors, eventHandler } from 'h3'

export default eventHandler((event) => {
  // Skip if in development
  if (import.meta.dev) {
    // add cors for devtools embed
    handleCors(event, {
      methods: '*',
      origin: [
        'https://admin.hub.nuxt.com'
      ]
    })
  }
})
