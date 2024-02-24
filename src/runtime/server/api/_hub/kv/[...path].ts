import { eventHandler } from 'h3'
import { createH3StorageHandler } from 'unstorage/server'
import { useKV } from '../../../utils/kv'

export default eventHandler(async (event) => {
  const storage = useKV()
  return createH3StorageHandler(storage, {
    resolvePath(event) {
      return event.context.params!.path || ''
    }
  })(event as any)
})
