import { eventHandler, readBody, createError } from 'h3'
import { kv } from 'hub:kv'
import { handleCors } from '../../utils/cors'

export default eventHandler(async (event) => {
  if (handleCors(event)) return
  const body = await readBody(event)
  if (body?.confirm !== 'CLEAR_ALL') {
    throw createError({ statusCode: 400, message: 'Confirmation required: send { confirm: "CLEAR_ALL" }' })
  }
  await kv.clear()
  return { cleared: true }
})
