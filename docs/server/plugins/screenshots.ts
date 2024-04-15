import { existsSync } from 'fs'
import { join } from 'pathe'
import captureWebsite from 'capture-website'

export default defineNitroPlugin(async (nitroApp) => {
  // only in dev
  if (!import.meta.dev) return
  // @ts-expect-error missing types for hook
  nitroApp.hooks.hook('content:file:afterParse', async (file) => {
    if (file._path === '/templates') {
      for (const template of file.templates) {
        const url = template.screenshotUrl || template.demo
        if (!url) {
          console.error(`Template ${template.slug} has no "demo" or "screenshotUrl" to take a screenshot from`)
          continue
        }
        const filename = join(process.cwd(), 'public/images/templates', `${template.slug}.png`)
        if (existsSync(filename)) {
          continue
        }
        console.log(`Generating screenshot for Template ${template.slug} hitting ${url}...`)
        await captureWebsite.file(url, filename, {
          ...(template.screenshotOptions || {}),
          launchOptions: { headless: 'new' }
        })
      }
    }
  })
})
