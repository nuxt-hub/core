export default eventHandler(async (event) => {
  const form = await readFormData(event)
  const file = form.get('file') as Blob

  if (!file || !file.size) {
    throw createError({ status: 400, message: 'No file provided' })
  }

  if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
    throw createError({ status: 400, message: 'File must be an image' })
  }

  return useBlob().put(`images/${file.name}`, file)
})
