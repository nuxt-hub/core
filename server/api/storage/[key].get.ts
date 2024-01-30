import { useValidatedParams, z } from 'h3-zod'

export default eventHandler(async (event) => {
  await requireUserSession(event)

  const { key } = await useValidatedParams(event, {
    key: z.string().min(1).max(100)
  })

  // List files for the current user

  const bucket = useBucket()
  const object = await bucket.get(key)

  if (!object) {
    throw createError({ message: 'File not found', statusCode: 404 })
  }

  setHeader(event, 'Content-Type', object.httpMetadata!.contentType!)
  setHeader(event, 'Content-Length', object.size)

  return object.body.getReader()
})
