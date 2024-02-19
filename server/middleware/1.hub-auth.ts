import { $fetch } from 'ofetch'

export default eventHandler(async (event) => {
  console.log('NuxtHub middleware')
  // Skip if not a hub request
  if (/^\/api\/_hub\//.test(event.path) === false) {
    return
  }
  // Skip if in development
  if (import.meta.dev) {
    return
  }
  const hub = useRuntimeConfig().hub
  const secretKey = (getHeader(event, 'authorization') || '').split(' ')[1]
  if (!secretKey) {
    throw createError({
      statusCode: 403,
      message: 'Missing Authorization header'
    })
  }

  // Self-hosted NuxtHub project, user has to set a secret key to access the proxy
  if (hub.projectSecretKey && secretKey !== hub.projectSecretKey) {
    throw createError({
      statusCode: 401,
      message: 'Invalid secret key'
    })
  }

  // Hosted on NuxtHub
  if (hub.projectId && /^\d+$/.test(String(hub.projectId))) {
    console.time('hub-check')
    // Here the secretKey is a user token
    await $fetch(`/api/projects/${hub.projectId}`, {
      baseURL: hub.url,
      method: 'HEAD',
      headers: {
        authorization: `Bearer ${secretKey}`
      }
    })
    console.timeEnd('hub-check')
    return
  }

  throw createError({
    statusCode: 401,
    message: 'Missing NUXT_HUB_PROJECT_SECRET_KEY'
  })
})
