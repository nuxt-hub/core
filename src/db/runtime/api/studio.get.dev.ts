// Proxy Drizzle Studio frontend to avoid CORS/Private Network Access issues
// Serving from localhost allows connecting to localhost:4983 without browser blocking

import { eventHandler, getQuery, setHeader, createError } from 'h3'

export default eventHandler(async (event) => {
  const query = getQuery(event)

  // Validate port to prevent XSS injection
  const port = parseInt(String(query.port)) || 4983
  if (port < 1 || port > 65535) {
    throw createError({ statusCode: 400, message: 'Invalid port' })
  }

  // Get path without query string
  const fullPath = event.path?.split('?')[0] || ''
  const path = fullPath.replace('/api/_hub/studio', '') || '/'

  // Validate path to prevent SSRF and path traversal
  if (path !== '/' && (!/^\/[a-zA-Z0-9._-]+$/.test(path) || path.includes('..'))) {
    throw createError({ statusCode: 400, message: 'Invalid path' })
  }

  // Proxy asset requests (JS, CSS, etc.)
  if (path !== '/' && path !== '') {
    try {
      const isBinary = path.endsWith('.svg') || path.endsWith('.png') || path.endsWith('.ico')
      const asset = await $fetch(`https://local.drizzle.studio${path}`, {
        responseType: isBinary ? 'blob' : 'text'
      })

      // Set appropriate content type
      if (path.endsWith('.js')) setHeader(event, 'Content-Type', 'application/javascript')
      else if (path.endsWith('.css')) setHeader(event, 'Content-Type', 'text/css')
      else if (path.endsWith('.svg')) setHeader(event, 'Content-Type', 'image/svg+xml')
      else if (path.endsWith('.png')) setHeader(event, 'Content-Type', 'image/png')
      else if (path.endsWith('.ico')) setHeader(event, 'Content-Type', 'image/x-icon')

      return asset
    } catch {
      throw createError({ statusCode: 502, message: 'Failed to fetch studio asset' })
    }
  }

  // Fetch the Drizzle Studio HTML
  let html: string
  try {
    html = await $fetch<string>('https://local.drizzle.studio/', {
      headers: { 'Accept': 'text/html' }
    })
  } catch {
    throw createError({ statusCode: 502, message: 'Failed to fetch Drizzle Studio' })
  }

  // Rewrite asset paths to go through our proxy
  let modifiedHtml = html
    .replace(/src="\.\/index\.js"/g, `src="/api/_hub/studio/index.js"`)
    .replace(/href="\.\/favicon\.svg"/g, `href="/api/_hub/studio/favicon.svg"`)

  // Inject port param
  modifiedHtml = modifiedHtml.replace(
    '</head>',
    `<script>
      if (!window.location.search.includes('port=')) {
        history.replaceState(null, '', window.location.pathname + '?port=${port}');
      }
    </script></head>`
  )

  setHeader(event, 'Content-Type', 'text/html')
  return modifiedHtml
})
