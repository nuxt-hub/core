import { createError, eventHandler, readFormData } from 'h3'
import { hubBlob, type BlobObject } from '../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../utils/auth'
import { requireNuxtHubFeature } from '../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const form = await readFormData(event)
  const files = form.getAll('files') as File[]
  if (!files) {
    throw createError({ statusCode: 400, message: 'Missing files' })
  }
  const blob = hubBlob()

  const objects: BlobObject[] = []
  try {
    for (const file of files) {
      // const object = await blob.put(file.name!, file, { addRandomSuffix: true })
      const object = await blob.put(file.name!, file)
      objects.push(object)
    }
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      message: `Storage error: ${e.message}`
    })
  }

  return objects
})
