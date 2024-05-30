export default eventHandler(async (event) => {
  const { prefix } = getQuery(event)
  const form = await readFormData(event)
  const files = form.getAll('files') as File[]
  if (!files) {
    throw createError({ statusCode: 400, message: 'Missing files' })
  }

  const { put } = hubBlob()
  const objects: BlobObject[] = []
  try {
    for (const file of files) {
      // const object = await put(file.name, file, { addRandomSuffix: true })
      const object = await put(file.name, file, {
        prefix: String(prefix || '')
      })
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
