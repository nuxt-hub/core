import cfPuppeteer from '@cloudflare/puppeteer'

export default eventHandler(async () => {
  const binding = process.env.BROWSER || globalThis.__env__?.BROWSER || globalThis.BROWSER
  return cfPuppeteer.limits(binding)
})
