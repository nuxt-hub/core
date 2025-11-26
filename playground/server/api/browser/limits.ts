import cfPuppeteer from '@cloudflare/puppeteer'

export default eventHandler(async () => {
  return cfPuppeteer.limits(process.env.BROWSER)
})
