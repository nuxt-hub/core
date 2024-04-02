import { useRuntimeConfig } from '#imports'

export default eventHandler(async (event) => {
  const hub = useRuntimeConfig().hub

  if (!hub.openapi) {
    throw createError({
      statusCode: 422,
      message: 'OpenAPI not configured'
    })
  }

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

