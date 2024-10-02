import type { H3Event } from 'h3'
import { getHeader, createError } from 'h3'
import { $fetch } from 'ofetch'

const localCache: Map<string, boolean> = new Map()

export async function requireNuxtHubAuthorization(event: H3Event) {
  // Skip if in development
  if (import.meta.dev) {
    return
  }

  // Check if authorization header is set
  const secretKeyOrUserToken = (getHeader(event, 'authorization') || '').split(' ')[1]
  if (!secretKeyOrUserToken) {
    throw createError({
      statusCode: 403,
      message: 'Missing Authorization header'
    })
  }

  // Get project key and secret key
  const env = event.context.cloudflare?.env || process.env || {}
  const projectKey = env.NUXT_HUB_PROJECT_KEY

  // Self-hosted NuxtHub project, user has to set a secret key to access the proxy
  const projectSecretKey = env.NUXT_HUB_PROJECT_SECRET_KEY
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
    if (localCache.has(secretKeyOrUserToken)) {
      return
    }
    // Here the secretKey is a user token
    await $fetch(`/api/projects/${projectKey}`, {
      baseURL: env.NUXT_HUB_URL || 'https://admin.hub.nuxt.com',
      method: 'HEAD',
      headers: {
        authorization: `Bearer ${secretKeyOrUserToken}`
      }
    }).catch((err) => {
      throw createError({
        statusCode: err.statusCode || 401,
        message: err.data?.message || err.message || 'Unauthorized'
      })
    })
    localCache.set(secretKeyOrUserToken, true)
    return
  }

  throw createError({
    statusCode: 401,
    message: 'Missing NUXT_HUB_PROJECT_SECRET_KEY environment variable or NUXT_HUB_PROJECT_KEY environment variable'
  })
}
