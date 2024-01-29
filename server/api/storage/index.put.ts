import type { MultiPartData } from 'h3'

export default eventHandler(async (event) => {
  await requireUserSession(event)

  const form: MultiPartData[] = await readMultipartFormData(event)
  const dataPart = form.find((part) => part.name === 'data')
  const filePart = form.find((part) => part.name === 'file')
  if (!dataPart || !filePart) {
    throw createError(`Missing ${!dataPart ? 'data' : 'file'} body param.`)
  }

  try {
    const data = JSON.parse(dataPart.data)
    const file = filePart.data.toString()

    // Set entry for the current user

    const res = await useBucket().put(data.key, file, {
      customMetadata: {
        filename: filePart.filename!,
        type: filePart.type!
      }
    })
    return res
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      message: `Storage error: ${e.message}`
    })
  }
})
