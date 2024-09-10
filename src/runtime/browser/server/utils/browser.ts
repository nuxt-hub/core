import cfPuppeteer, { PuppeteerWorkers } from '@cloudflare/puppeteer'
import type { Puppeteer, Browser, Page, BrowserWorker, ActiveSession } from '@cloudflare/puppeteer'
import { createError } from 'h3'
// @ts-expect-error useNitroApp not yet typed
import { randomUUID } from 'uncrypto'
import { useNitroApp, useEvent } from '#imports'

function getBrowserBinding(name: string = 'BROWSER'): BrowserWorker | undefined {
  // @ts-expect-error globalThis.__env__ is not typed
  return process.env[name] || globalThis.__env__?.[name] || globalThis[name]
}

interface HubBrowserOptions {
  /**
   * Keep the browser instance alive for the given number of seconds.
   * Maximum value is 600 seconds (10 minutes).
   *
   * @default 60
   */
  keepAlive?: number
}

interface HubBrowser {
  browser: Browser
  page: Page
}

let _browserPromise: Promise<Browser> | null = null
let _browser: Browser | null = null
/**
 * Get a browser instance (puppeteer)
 *
 * @example ```ts
 * const { page } = await hubBrowser()
 * await page.goto('https://hub.nuxt.com')
 * const img = await page.screenshot()
 * ```
 *
 * @see https://hub.nuxt.com/docs/features/browser
 */
export async function hubBrowser(options: HubBrowserOptions = {}): Promise<HubBrowser> {
  const puppeteer = await getPuppeteer()
  const nitroApp = useNitroApp()
  const event = useEvent()
  // If in production, use Cloudflare Puppeteer
  if (puppeteer instanceof PuppeteerWorkers) {
    const binding = getBrowserBinding()
    if (!binding) {
      throw createError('Missing Cloudflare Browser binding (BROWSER)')
    }
    let browser: Browser | null = null
    const sessionId = await getRandomSession(puppeteer, binding)
    // if there is free open session, connect to it
    if (sessionId) {
      try {
        browser = await puppeteer.connect(binding, sessionId)
      } catch (e) {
        // another worker may have connected first
      }
    }
    if (!browser) {
      // No open sessions, launch new session
      browser = await puppeteer.launch(binding, {
        // keep_alive is in milliseconds
        // https://developers.cloudflare.com/browser-rendering/platform/puppeteer/#keep-alive
        keep_alive: (options.keepAlive || 60) * 1000
      })
    }
    const page = await browser.newPage()
    // Disconnect browser after response
    event.waitUntil({
      async then() {
        console.log('closing browser & page')
        await page?.close().catch(() => {})
        browser?.disconnect()
      }
    })
    return {
      browser,
      page
    }
  }
  if (!_browserPromise) {
    // @ts-expect-error we use puppeteer directly here
    _browserPromise = puppeteer.launch()
    // Stop browser when server shuts down or restarts
    nitroApp.hooks.hook('close', async () => {
      const browser = _browser || await _browserPromise
      browser?.close()
      _browserPromise = null
      _browser = null
    })
  }
  if (!_browser) {
    _browser = (await _browserPromise) as Browser
    // Make disconnect a no-op
    _browser.disconnect = () => {}
  }
  const page = await _browser.newPage()
  const unregister = nitroApp.hooks.hook('afterResponse', async (closingEvent) => {
    if (event !== closingEvent) return
    unregister()
    await page?.close().catch(() => {})
  })
  return {
    browser: _browser,
    page
  }
}

async function getRandomSession(puppeteer: PuppeteerWorkers, binding: BrowserWorker): Promise<string | null> {
  const sessions: ActiveSession[] = await puppeteer.sessions(binding)
  const sessionsIds = sessions
    // remove sessions with workers connected to them
    .filter(v => !v.connectionId)
    .map(v => v.sessionId)

  if (!sessionsIds.length) {
    return null
  }

  return sessionsIds[Math.floor(Math.random() * sessionsIds.length)]
}

let _puppeteer: PuppeteerWorkers | Puppeteer
async function getPuppeteer() {
  if (_puppeteer) {
    return _puppeteer
  }
  if (import.meta.dev) {
    const _pkg = 'puppeteer' // Bypass bundling!
    _puppeteer = (await import(_pkg).catch(() => {
      throw new Error(
        'Package `puppeteer` not found, please install it with: `npx ni puppeteer`'
      )
    }))
  } else {
    _puppeteer = cfPuppeteer
  }
  return _puppeteer
}
