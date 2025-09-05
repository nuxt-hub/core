import { eventHandler, getValidatedRouterParams, getHeader, getRequestWebStream, getQuery } from 'h3'
import { z } from 'zod'
import { hubBlob } from '#imports'

// Simple streamToArrayBuffer implementation for test fixture
async function streamToArrayBuffer(stream: ReadableStream, _contentLength: number): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks = []
  let receivedLength = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    receivedLength += value.length
  }

  const result = new Uint8Array(receivedLength)
  let position = 0
  for (const chunk of chunks) {
    result.set(chunk, position)
    position += chunk.length
  }

  return result
}

export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  const query = getQuery(event)
  const contentType = getHeader(event, 'content-type')
  const contentLength = getHeader(event, 'content-length') || '0'

  const options = { ...query }
  if (!options.contentType) {
    options.contentType = contentType
  }
  if (!options.contentLength) {
    options.contentLength = contentLength
  }
  if (typeof options.customMetadata === 'string') {
    try {
      options.customMetadata = JSON.parse(options.customMetadata)
    } catch (e) {
      options.customMetadata = {}
    }
  }

  // sanitize addRandomSuffix which is a boolean
  options.addRandomSuffix = options.addRandomSuffix === 'true'

  const stream = getRequestWebStream(event)!
  const body = await streamToArrayBuffer(stream, Number(contentLength))

  return hubBlob().put(pathname, body, options)
})
