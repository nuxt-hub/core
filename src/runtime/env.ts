import { eventHandler } from 'h3'

// Hack around Cloudflare regression since nodejs_compat_v2 for process.env
export default eventHandler((event) => {
  const env = event.context.cloudflare?.env || {}
  for (const key in env) {
    // Only set env if process.env[key] is undefined and env[key] is not a binding
    if (typeof process.env[key] === 'undefined' && typeof env[key] === 'string') {
      process.env[key] = env[key]
    }
  }
})
