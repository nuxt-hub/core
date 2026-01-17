import { eventHandler, readBody, createError } from 'h3'
import { useStorage } from 'nitropack/runtime'

export default eventHandler(async (event) => {
  const body = await readBody(event)
  if (body?.confirm !== 'CLEAR_ALL') {
    throw createError({ statusCode: 400, message: 'Confirmation required: send { confirm: "CLEAR_ALL" }' })
  }
  const cache = useStorage('cache')
  await cache.clear()
  return { cleared: true }
})
