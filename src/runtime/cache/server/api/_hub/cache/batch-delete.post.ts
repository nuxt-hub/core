import { eventHandler, readValidatedBody, sendNoContent } from 'h3'
import { z } from 'zod'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'
import { useStorage } from '#imports'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('cache')

  const { keys } = await readValidatedBody(event, z.object({
    keys: z.array(z.string().min(1)).min(1)
  }).parse)

  const storage = useStorage('cache')
  // delete with batch of 25 keys
  do {
    const keysToDelete = keys.splice(0, 25)
    await Promise.all(keysToDelete.map(key => storage.removeItem(key)))
  } while (keys.length)

  return sendNoContent(event)
})
