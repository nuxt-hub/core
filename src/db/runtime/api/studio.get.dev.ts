// Proxy Drizzle Studio frontend to avoid CORS/Private Network Access issues
// Serving from localhost allows connecting to localhost:4983 without browser blocking

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const port = query.port || 4983
  // Get path without query string
  const fullPath = event.path?.split('?')[0] || ''
  const path = fullPath.replace('/api/_hub/studio', '') || '/'


  // Proxy asset requests (JS, CSS, etc.)
  if (path !== '/' && path !== '') {
    try {
      // Use text for JS/CSS, blob for binary
      const isBinary = path.endsWith('.svg') || path.endsWith('.png') || path.endsWith('.ico')
      const asset = await $fetch(`https://local.drizzle.studio${path}`, {
        responseType: isBinary ? 'blob' : 'text'
      })

      // Set appropriate content type
      if (path.endsWith('.js')) setHeader(event, 'Content-Type', 'application/javascript')
      else if (path.endsWith('.css')) setHeader(event, 'Content-Type', 'text/css')
      else if (path.endsWith('.svg')) setHeader(event, 'Content-Type', 'image/svg+xml')

      return asset
    } catch (error: any) {
      throw createError({ statusCode: 502, message: `Failed to fetch studio asset: ${path}` })
    }
  }

  // Fetch the Drizzle Studio HTML
  const html = await $fetch<string>('https://local.drizzle.studio/', {
    headers: { 'Accept': 'text/html' }
  })

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
