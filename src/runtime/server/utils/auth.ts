import type { H3Event } from 'h3'
import { getHeader, createError, handleCors } from 'h3'
import { $fetch } from 'ofetch'

const localCache: Record<string, boolean> = {}

export async function requireNuxtHubAuthorization(event: H3Event) {
  // Skip if in development
  if (import.meta.dev) {
    // add cors for devtools embed
    handleCors(event, {
      methods: '*',
      origin: [
        'https://admin.hub.nuxt.com'
      ]
    })
    return
  }

  const secretKeyOrUserToken = (getHeader(event, 'authorization') || '').split(' ')[1]
  if (!secretKeyOrUserToken) {
    throw createError({
      statusCode: 403,
      message: 'Missing Authorization header'
    })
  }
  const projectKey = process.env.NUXT_HUB_PROJECT_KEY

  // Self-hosted NuxtHub project, user has to set a secret key to access the proxy
  const projectSecretKey = process.env.NUXT_HUB_PROJECT_SECRET_KEY
  if (projectSecretKey && secretKeyOrUserToken === projectSecretKey) {
    return
  } else if (projectSecretKey && !projectKey) {
    throw createError({
      statusCode: 401,
      message: 'Invalid secret key'
    })
  }

  // Hosted on NuxtHub
  if (projectKey) {
    if (localCache[secretKeyOrUserToken]) {
      return
    }
    // Here the secretKey is a user token
    await $fetch(`/api/projects/${projectKey}`, {
      baseURL: process.env.NUXT_HUB_URL || 'https://admin.hub.nuxt.com',
      method: 'HEAD',
      headers: {
        authorization: `Bearer ${secretKeyOrUserToken}`
      }
    })
    localCache[secretKeyOrUserToken] = true
    return
  }

  throw createError({
    statusCode: 401,
    message: 'Missing NUXT_HUB_PROJECT_SECRET_KEY envrionment variable or NUXT_HUB_PROJECT_KEY envrionment variable'
  })
}
