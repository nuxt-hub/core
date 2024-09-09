export default cachedEventHandler(async (event) => {
  const { url } = await getValidatedQuery(event, z.object({
    url: z.string().url()
  }).parse)

  // Get a browser instance and navigate to the url
  const { page } = await hubBrowser()
  await page.goto(url, { waitUntil: 'networkidle0' })

  // Extract metadata from the page
  const metadata = await page.evaluate(() => {
    const getMetaContent = (name) => {
      const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
      return element ? element.getAttribute('content') : null
    }

    return {
      title: document.title,
      description: getMetaContent('description') || getMetaContent('og:description'),
      favicon: document.querySelector('link[rel="shortcut icon"]')?.href
      || document.querySelector('link[rel="icon"]')?.href,
      ogImage: getMetaContent('og:image'),
      origin: document.location.origin
    }
  })

  return metadata
}, {
  maxAge: 60 * 60 * 24 * 7, // 1 week
  swr: true,
  group: 'api',
  name: 'metadata',
  // Use the URL as key to invalidate the cache when the URL changes
  // We use btoa to transform the URL to a base64 string
  getKey: event => btoa(getQuery(event).url)
})
