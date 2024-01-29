import { ReadableStreamDefaultReader } from '@cloudflare/workers-types/experimental'
import { useValidatedParams, useValidatedQuery, z, zh } from 'h3-zod'

export default eventHandler(async (event) => {
  await requireUserSession(event)


  const { key } = await useValidatedParams(event, {
    key: z.string().min(1).max(100)
  })
  const { populate } = await useValidatedQuery(event, {
    populate: zh.boolAsString.optional().default('false')
  })

  // List files for the current user

  const bucket = useBucket()
  const object = await bucket.get(key)

  if (!object) {
    throw createError({ message: 'File not found', statusCode: 404 })
  }

  if (populate) {
    const bodyReader: ReadableStreamDefaultReader<Uint8Array> = object.body.getReader()
    const body = await processStream(bodyReader)
    return {
      ...object,
      body: Buffer.from(body).toString('base64')
    }
  }

  return object
})
