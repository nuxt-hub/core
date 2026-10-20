import { eventHandler, getQuery, createError, getRequestURL, readFormData } from 'h3'
import { blob } from 'hub:blob'
import { handleCors } from '../../utils/cors'

function safeDecodeURIComponent(input: string) {
  try {
    return decodeURIComponent(input)
  } catch {
    return input
  }
}

export default eventHandler(async (event) => {
  if (handleCors(event)) return
  const method = event.method
  // Nitro's `**:pathname` router param can be unreliable for deep paths; derive from URL.
  const base = '/_hub/devtools/blob/'
  const urlPath = getRequestURL(event).pathname
  const raw = urlPath.startsWith(base) ? urlPath.slice(base.length) : ''
  const pathname = safeDecodeURIComponent(raw.replace(/^\/+/, ''))
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
    const form = await readFormData(event)
    const file = form.get('file')
    if (!(file instanceof File)) {
      throw createError({ statusCode: 400, message: 'Missing file' })
    }
    const object = await blob.put(pathname, file)
    return [object]
  }

  if (method === 'DELETE') {
    await blob.del(pathname)
    return { pathname, deleted: true }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
