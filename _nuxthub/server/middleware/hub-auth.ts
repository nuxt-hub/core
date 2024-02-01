export default eventHandler(async (event) => {
  if (/^\/api\/_hub\//.test(event.path) === false || import.meta.dev) {
    return
  }

  // Authorize the request
  // console.log('Authorizing the request to hub.nuxt.com...')
  // Format Authorization: Bearer <secretKey>
  // const [, secretKey] = (getHeader(event, 'authorization') || '').split(' ')
  // await $fetch('https://hub.nuxt.com/api/authorize', {
  //   method: 'HEAD',
  //   headers: {
  //     'x-project-id': process.env.NUXT_HUB_PROJECT_ID || '',
  //     authorization: `Bearer ${secretKey}`
  //   }
  // })
})