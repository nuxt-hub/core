import { eventHandler, getQuery } from 'h3'
import { destr } from 'destr'
import { hubBlob } from '../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const query = getQuery(event)

  return hubBlob().handleUpload(event, {
    formKey: query.formKey || 'files',
    multiple: query.multiple !== 'false',
    put: destr(query.put),
    ensure: destr(query.ensure)
  })
})
