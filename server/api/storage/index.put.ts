export default eventHandler(async (event) => {
  await requireUserSession(event)

  let files = (await readMultipartFormData(event) || [])

  // Filter only files
  files = files.filter((file) => Boolean(file.filename))
  if (!files) {
    throw createError({ statusCode: 400, message: 'Missing files' })
  }

  const { put } = useBlob()

  const objects = []

  try {
    for (const file of files) {
      const object = await put(file)
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
