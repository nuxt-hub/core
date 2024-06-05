import { handleCors, eventHandler, sendNoContent } from 'h3'

export default eventHandler((event) => {
  // add cors for devtools embed
  handleCors(event, {
    methods: '*',
    origin: [
      'https://admin.hub.nuxt.com'
    ]
  })
})
