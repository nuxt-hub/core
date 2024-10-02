import type { NitroAppPlugin } from 'nitropack'
import type { H3Event } from 'h3'

// Hack around Cloudflare regression since nodejs_compat_v2 for process.env
export default <NitroAppPlugin> function (nitroApp) {
  nitroApp.hooks.hook('request', async (event: H3Event) => {
    const env = event.context.cloudflare?.env || {}
    for (const key in env) {
      process.env[key] = env[key]
    }
  })
}
