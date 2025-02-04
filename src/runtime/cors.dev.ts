import { handleCors, eventHandler } from 'h3'

export default eventHandler((event) => {
  // add cors for devtools embed
  handleCors(event, {
    methods: '*',
    origin: [
      'https://admin.hub.nuxt.com',
      'https://hub.nuxt.dev',
      /http:\/\/localhost:\d+/
    ]
  })
})
