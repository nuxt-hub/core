import { eventHandler, createError, getRequestURL, readFormData } from 'h3'
import { blob } from 'hub:blob'
import { handleCors } from '../../../utils/cors'

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
  const baseRoute = '/api/_hub/blob/'
  const urlPath = getRequestURL(event).pathname
  const raw = urlPath.startsWith(baseRoute) ? urlPath.slice(baseRoute.length) : ''
  const pathname = safeDecodeURIComponent(raw.replace(/^\/+/, ''))
  if (!pathname) throw createError({ statusCode: 400, message: 'Pathname is required' })

  if (method === 'GET') {
    return blob.serve(event, pathname)
  }

  if (method === 'PUT') {
    const form = await readFormData(event)
    const file = form.get('file')
    if (!(file instanceof File)) {
      throw createError({ statusCode: 400, message: 'Missing file' })
    }
    await blob.put(pathname, file)
    return 'OK'
  }

  if (method === 'DELETE') {
    await blob.del(pathname)
    return 'OK'
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
