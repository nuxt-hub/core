import { eventHandler, getQuery } from 'h3'
import { hubBlob } from '../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../utils/auth'
import { requireNuxtHubFeature } from '../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const query = getQuery(event)

  return hubBlob().handleUpload(event, {
    formKey: 'files',
    multiple: true,
    ...query
  })
})
