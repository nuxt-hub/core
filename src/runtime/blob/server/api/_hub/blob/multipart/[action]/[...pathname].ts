import { eventHandler, getQuery } from 'h3'
import { hubBlob } from '../../../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const options = { ...getQuery(event) }
  if (typeof options.customMetadata === 'string') {
    try {
      options.customMetadata = JSON.parse(options.customMetadata)
    } catch (e) {
      options.customMetadata = {}
    }
  }
  event.context.params!.pathname = decodeURIComponent(event.context.params!.pathname)
  return await hubBlob().handleMultipartUpload(event, {
    ...options
  })
})
