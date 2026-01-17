import { eventHandler, getRouterParam, getQuery, createError } from 'h3'
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  const method = event.method
  const pathname = getRouterParam(event, 'pathname') || ''
  if (!pathname) throw createError({ statusCode: 400, message: 'Pathname is required' })

  if (method === 'GET') {
    const meta = getQuery(event).meta === 'true'
    if (meta) {
      const head = await blob.head(pathname)
      if (!head) throw createError({ statusCode: 404, message: 'Blob not found' })
      return head
    }
    return blob.serve(event, pathname)
  }

  if (method === 'PUT') {
    return blob.handleUpload(event, { formKey: 'file', multiple: false, put: { pathname } })
  }

  if (method === 'DELETE') {
    await blob.del(pathname)
    return { pathname, deleted: true }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
