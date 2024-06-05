import { eventHandler, getQuery } from 'h3'
import { hubBlob } from '../../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../../utils/auth'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  const query = getQuery(event)

  return hubBlob().handleUpload(event, {
    formKey: 'files',
    ...query,
    multiple: query.multiple !== 'false'
  })
})
