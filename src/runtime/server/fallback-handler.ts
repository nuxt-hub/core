import { eventHandler, createError } from 'h3'
import { requireNuxtHubFeature } from './utils/features'

export default eventHandler((event) => {
  const [feature] = event.path.replace(/^\/api\/_hub\//, '').split('/')

  requireNuxtHubFeature(feature as any)

  throw createError({
    statusCode: 404,
    message: `Not found`
  })
})
