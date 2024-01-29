import type { MultiPartData } from 'h3'

export default eventHandler(async (event) => {
  await requireUserSession(event)

  const form: MultiPartData[] | undefined = await readMultipartFormData(event)
  if (!form) {
    throw createError('Request body must be multipart.')
  }
  const dataPart = form.find((part) => part.name === 'data')
  const filePart = form.find((part) => part.name === 'file')
  if (!dataPart || !filePart) {
    throw createError(`Missing ${!dataPart ? 'data' : 'file'} body param.`)
  }

  try {
    const data = JSON.parse(dataPart.data.toString())
    const file = filePart.data
    const type = filePart.type || getContentType(data.key)
    const httpMetadata = { contentType: type }
    const customMetadata = getMetadata(type, filePart.data)

    // Set entry for the current user

    const object = await useBucket().put(data.key, file.toString(), { httpMetadata, customMetadata })
    return {
      ...object,
      body: file.toString('base64')
    }
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      message: `Storage error: ${e.message}`
    })
  }
})
