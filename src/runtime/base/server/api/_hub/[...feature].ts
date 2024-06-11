import { eventHandler, createError } from 'h3'
import { requireNuxtHubFeature } from '../../../../utils/features'

// catch all handler for /api/_hub/**
export default eventHandler((event) => {
  const [feature] = (event.context.params?.feature || '').split('/')

  requireNuxtHubFeature(feature as any)

  throw createError({
    statusCode: 404,
    message: `Not found`
  })
})
