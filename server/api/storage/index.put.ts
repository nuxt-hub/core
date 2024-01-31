export default eventHandler(async (event) => {
  await requireUserSession(event)

  const files = await readFiles(event)
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
