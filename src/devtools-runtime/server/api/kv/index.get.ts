import { eventHandler, getQuery } from 'h3'
import { kv } from 'hub:kv'

export default eventHandler(async (event) => {
  const { prefix = '' } = getQuery(event)
  const keys = await kv.keys(prefix as string)
  return Promise.all(keys.map(async key => ({ key, value: await kv.get(key) })))
})
