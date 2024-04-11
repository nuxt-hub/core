import { eventHandler, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { requireNuxtHubAuthorization } from '../../utils/auth'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  const hub = useRuntimeConfig().hub

  if (!hub.openapi) {
    throw createError({
      statusCode: 422,
      message: 'OpenAPI not configured'
    })
  }

  // TODO: create an alias for it so when disabled, does not throw an error
  const openapi = await import('#internal/nitro/routes/openapi')
    .then((mod) => mod.default)
    .catch(() => undefined)

  if (typeof openapi !== 'function') {
    throw createError({
      statusCode: 404,
      message: 'not found'
    })
  }

  return openapi(event)
})

