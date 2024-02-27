import { eventHandler } from 'h3'
import { createH3StorageHandler } from 'unstorage/server'
import { hubKV } from '../../../utils/kv'

export default eventHandler(async (event) => {
  const storage = hubKV()
  return createH3StorageHandler(storage, {
    resolvePath(event) {
      return event.context.params!.path || ''
    }
  })(event as any)
})
