import { z } from 'zod'

export default eventHandler(async (event) => {
  const { url, theme } = await getValidatedQuery(event, z.object({
    url: z.string().url(),
    theme: z.enum(['light', 'dark']).optional().default('light')
  }).parse)

  const { page } = await hubBrowser({ keepAlive: 300 })

  await page.setViewport({ width: 1920, height: 1080 })
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }])
  console.log('Navigating to', url)
  await page.goto(url, { waitUntil: 'domcontentloaded' })

  // Hack around some CSS issues
  await page.evaluate(() => {
    const style = window.document.createElement('style')
    style.textContent = 'body * {will-change: unset !important; --tw-backdrop-blur: none !important;-webkit-backdrop-filter: none !important;backdrop-filter: none !important;backdrop-filter: none !important;}'
    window.document.head.appendChild(style)
  })
  await new Promise(resolve => setTimeout(resolve, 2000))
  const framework = await page.evaluate(() => {
    if (window.__NUXT__) return 'Nuxt'
    if (window.next?.version) return 'Next'
    if (window.__remixContext) return 'Remix'
    return ''
  })

  const screenshot = await page.screenshot()

  // Upload the screenshot to the Blob storage
  const filename = `screenshots/${btoa(url + theme)}.jpg`
  await hubBlob().put(filename, screenshot, {
    addRandomSuffix: false
  })
  await page.close()

  setHeader(event, 'content-type', 'image/jpeg')
  setHeader(event, 'x-framework', framework)
  return screenshot
})
