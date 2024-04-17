import { eventHandler, readValidatedBody, sendNoContent } from 'h3'
import { z } from 'zod'
import { requireNuxtHubAuthorization } from '../../../utils/auth'
import { requireNuxtHubFeature } from '../../../utils/features'
// @ts-expect-error missing type
import { useStorage } from '#imports'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('cache')

  const { keys } = await readValidatedBody(event, z.object({
    keys: z.array(z.string().min(1)).min(1)
  }).parse)

  const storage = useStorage('cache:nitro')
  // delete with batch of 10 keys
  do {
    const keysToDelete = keys.splice(0, 10)
    await Promise.all(keysToDelete.map(storage.removeItem))
  } while (keys.length)

  return sendNoContent(event)
})
