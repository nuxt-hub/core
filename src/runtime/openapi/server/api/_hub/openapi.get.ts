import { eventHandler, createError, type H3Event } from 'h3'
import { requireNuxtHubAuthorization } from '../../../../utils/auth'
import { useRuntimeConfig } from '#imports'

export default eventHandler(async (event: H3Event) => {
  await requireNuxtHubAuthorization(event)
  const hub = useRuntimeConfig().hub

  if (!hub.openapi) {
    throw createError({
      statusCode: 422,
      message: 'OpenAPI not configured'
    })
  }

  return $fetch((hub as any).openAPIRoute).catch(() => ({}))
})
