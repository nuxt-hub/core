import { eventHandler, createError, type H3Event } from 'h3'
import { requireNuxtHubAuthorization } from '../../../../utils/auth'
import { useRuntimeConfig } from '#imports'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  const hub = useRuntimeConfig().hub

  if (!hub.openapi) {
    throw createError({
      statusCode: 422,
      message: 'OpenAPI not configured'
    })
  }

  // @ts-expect-error #hub/openapi has no exported types
  const openapi: (event: H3Event) => any = await import('#hub/openapi')
    .then(mod => mod.default)
    .catch(() => undefined)

  if (typeof openapi !== 'function') {
    throw createError({
      statusCode: 404,
      message: 'not found'
    })
  }

  return openapi(event)
})
