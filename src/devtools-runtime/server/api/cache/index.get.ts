import { eventHandler, getQuery } from 'h3'
import { useStorage } from 'nitropack/runtime'
import { handleCors } from '../../utils/cors'

export default eventHandler(async (event) => {
  if (handleCors(event)) return
  const { prefix = '' } = getQuery(event)
  const cache = useStorage('cache')
  const keys = await cache.getKeys(prefix as string)
  return Promise.all(keys.map(async (key) => {
    try {
      const value = await cache.getItem(key)
      return { key, value }
    } catch {
      return { key, value: null }
    }
  }))
})
