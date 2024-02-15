export default eventHandler(async (event) => {
  const form = await readFormData(event)
  const file = form.get('file') as Blob

  if (!file || !file.size) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }

  ensureBlob(file, { maxSize: '1MB', types: ['image' ]})

  return useBlob().put(`images/${file.name}`, file, { addRandomSuffix: false })
})
