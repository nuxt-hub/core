import { createError, eventHandler, readFormData } from 'h3'
import { hubBlob, type BlobObject } from '../../../utils/blob'

export default eventHandler(async (event) => {
  const form = await readFormData(event)
  const files = form.getAll('files') as File[]
  if (!files) {
    throw createError({ statusCode: 400, message: 'Missing files' })
  }
  const blob = hubBlob()

  const objects: BlobObject[] = []
  try {
    for (const file of files) {
      const object = await blob.put(file.name!, file, { addRandomSuffix: true })
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
