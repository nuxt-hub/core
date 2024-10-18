import { eventHandler, getValidatedRouterParams, getHeader, getRequestWebStream, getQuery } from 'h3'
import { z } from 'zod'
import { hubBlob } from '../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'
import { streamToArrayBuffer } from '../../../../../utils/stream'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

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

  return hubBlob().put(decodeURIComponent(pathname), body, options)
})
