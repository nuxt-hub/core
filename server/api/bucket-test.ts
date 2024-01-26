import { R2ListOptions } from '@cloudflare/workers-types/experimental'

export default eventHandler(async (event) => {
  const bucket = useBucket()

  await bucket.put('test2.txt', 'Hello World!', {
    httpMetadata: {
      contentType: 'text/plain'
    }
  })

  const options: R2ListOptions = {
    limit: 500,
    include: ['httpMetadata', 'customMetadata'],
  }
  // https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#r2listoptions
  const listed = await bucket.list(options)
  let truncated = listed.truncated
  let cursor = listed.truncated ? listed.cursor : undefined

  while (truncated) {
    const next = await bucket.list({
      ...options,
      cursor: cursor,
    })
    listed.objects.push(...next.objects)

    truncated = next.truncated
    cursor = next.truncated ? next.cursor : undefined
  }

  return listed.objects
})