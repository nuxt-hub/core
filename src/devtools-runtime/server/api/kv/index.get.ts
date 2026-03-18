import { eventHandler, getQuery } from 'h3'
import { kv } from 'hub:kv'
import { handleCors } from '../../utils/cors'

export default eventHandler(async (event) => {
  if (handleCors(event)) return
  const { prefix = '' } = getQuery(event)
  const keys = await kv.keys(prefix as string)
  return Promise.all(keys.map(async key => ({ key, value: await kv.get(key) })))
})
