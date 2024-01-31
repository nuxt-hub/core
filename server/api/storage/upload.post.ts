export default eventHandler(async (event) => {
  console.log('before')
  const form = await readFormData(event)
  console.log('getting file')
  const file = form.get('file') as Blob
  console.log('after')

  if (!file || !file.size) {
    throw createError({ status: 400, message: 'No file provided' })
  }

  if (!file.type.startsWith('image/')) {
    throw createError({ status: 400, message: 'File must be an image' })
  }

  return useBlob().put(`images/${file.name}`, file)
})
