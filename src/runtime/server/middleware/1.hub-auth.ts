import { eventHandler, getHeader, createError } from 'h3'
import { $fetch } from 'ofetch'

export default eventHandler(async (event) => {
  // Skip if not a hub request
  if (/^\/api\/_hub\//.test(event.path) === false) {
    return
  }
  // Skip if in development
  if (import.meta.dev) {
    return
  }
  const secretKeyOrUserToken = (getHeader(event, 'authorization') || '').split(' ')[1]
  if (!secretKeyOrUserToken) {
    throw createError({
      statusCode: 403,
      message: 'Missing Authorization header'
    })
  }

  // Self-hosted NuxtHub project, user has to set a secret key to access the proxy
  const projectSecretKey = process.env.NUXT_HUB_PROJECT_SECRET_KEY
  if (projectSecretKey && secretKeyOrUserToken !== projectSecretKey) {
    throw createError({
      statusCode: 401,
      message: 'Invalid secret key'
    })
  }

  // Hosted on NuxtHub
  const projectKey = process.env.NUXT_HUB_PROJECT_KEY
  if (projectKey) {
    // Here the secretKey is a user token
    await $fetch(`/api/projects/${projectKey}`, {
      baseURL: process.env.NUXT_HUB_URL || 'https://hub.nuxt.com',
      method: 'HEAD',
      headers: {
        authorization: `Bearer ${secretKeyOrUserToken}`
      }
    })
    return
  }

  throw createError({
    statusCode: 401,
    message: 'Missing NUXT_HUB_PROJECT_SECRET_KEY envrionment variable or NUXT_HUB_PROJECT_KEY envrionment variable'
  })
})
