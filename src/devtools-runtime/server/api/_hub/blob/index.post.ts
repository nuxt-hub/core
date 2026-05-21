import { eventHandler, getQuery } from 'h3'
import { destr } from 'destr'
import { blob } from 'hub:blob'
import { handleCors } from '../../../utils/cors'

export default eventHandler(async (event) => {
  if (handleCors(event)) return
  const query = getQuery(event)
  return blob.handleUpload(event, {
    formKey: (query.formKey as string) || 'files',
    multiple: query.multiple !== 'false',
    put: destr(query.put),
    ensure: destr(query.ensure)
  })
})
