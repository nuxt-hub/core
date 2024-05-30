import { eventHandler } from 'h3'
import { z } from 'zod'
import { hubBlob } from '../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../utils/auth'
import { requireNuxtHubFeature } from '../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const { prefix } = await readValidatedBody(event, z.object({
    prefix: z.string().min(1)
  }).parse)

  const blob = hubBlob()

  const blobs = await blob.list({ prefix, limit: 1000 })
  const pathnames = blobs.blobs.map(blob => blob.pathname)

  await blob.delete(pathnames)

  return sendNoContent(event)
})
