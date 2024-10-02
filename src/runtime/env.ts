import { eventHandler } from 'h3'

// Hack around Cloudflare regression since nodejs_compat_v2 for process.env
export default eventHandler((event) => {
  const env = event.context.cloudflare?.env || {}
  for (const key in env) {
    process.env[key] = process.env[key] || env[key]
  }
})
