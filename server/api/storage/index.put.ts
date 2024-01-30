import { randomUUID } from 'uncrypto'

export default eventHandler(async (event) => {
  await requireUserSession(event)

  let files = (await readMultipartFormData(event) || [])

  // Filter only files
  files = files.filter((file) => Boolean(file.filename))
  if (!files) {
    throw createError({ statusCode: 400, message: 'Missing files' })
  }
  const objects = []

  try {
    for (const file of files) {
      const type = file.type || getContentType(file.filename)
      const extension = getExtension(type)
      // TODO: ensure filename unicity
      const filename = [randomUUID(), extension].filter(Boolean).join('.')
      const httpMetadata = { contentType: type }
      const customMetadata = getMetadata(type, file.data)
      const object = await useBucket().put(filename, toArrayBuffer(file.data), { httpMetadata, customMetadata })
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
