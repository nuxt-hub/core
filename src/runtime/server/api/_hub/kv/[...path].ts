import { eventHandler } from 'h3'
import { createH3StorageHandler } from 'unstorage/server'
import { hubKV } from '../../../utils/kv'
import { requireNuxtHubAuthorization } from '../../../utils/auth'
import { requireNuxtHubFeature } from '../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('kv')

  const storage = hubKV()
  return createH3StorageHandler(storage, {
    resolvePath(event) {
      return event.context.params!.path || ''
    }
  })(event as any)
})
