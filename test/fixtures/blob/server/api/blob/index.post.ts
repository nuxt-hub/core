import { eventHandler, getQuery } from 'h3'
import { destr } from 'destr'
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  const query = getQuery(event)

  return blob.handleUpload(event, {
    formKey: query.formKey as string || 'files',
    multiple: query.multiple !== 'false',
    put: destr(query.put),
    ensure: destr(query.ensure)
  })
})
