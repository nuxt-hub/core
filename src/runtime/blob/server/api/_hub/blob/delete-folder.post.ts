import { eventHandler, readValidatedBody, sendNoContent } from 'h3'
import { z } from 'zod'
import { hubBlob } from '../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const { prefix } = await readValidatedBody(event, z.object({
    prefix: z.string().min(1)
  }).parse)

  const blob = hubBlob()

  let cursor = undefined
  const pathnames = []

  do {
    const blobs = await blob.list({ prefix, limit: 1000, cursor })
    pathnames.push(...blobs.blobs.map(blob => blob.pathname))
    cursor = blobs.cursor
  } while (cursor)

  await blob.delete(pathnames)

  return sendNoContent(event)
})
