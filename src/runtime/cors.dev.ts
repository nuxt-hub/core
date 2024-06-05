import { handleCors, eventHandler, sendNoContent } from 'h3'

export default eventHandler((event) => {
  if (event.method === 'OPTIONS') {
    // add cors for devtools embed
    handleCors(event, {
      methods: '*',
      origin: [
        'https://admin.hub.nuxt.com'
      ]
    })
    return sendNoContent(event)
  }
})
