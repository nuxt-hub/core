export type ResolveDevtoolsAppOriginOptions = {
  /**
   * Full origin override (e.g. "http://localhost:3010").
   * When provided, it wins over all other detection.
   */
  appOrigin?: string
  https?: boolean
  /**
   * Full dev server URL from Nuxt (e.g. "http://0.0.0.0:3010/").
   * Prefer this when available as it reflects the actual listening port.
   */
  devServerUrl?: string
  devServerPort?: number | string
  argv?: string[]
  env?: Record<string, string | undefined>
  defaultPort?: number
}

function parsePort(input: unknown): number | undefined {
  const n = typeof input === 'string'
    ? Number.parseInt(input, 10)
    : typeof input === 'number'
      ? input
      : Number.NaN
  if (!Number.isFinite(n)) return
  if (n <= 0 || n >= 65536) return
  return Math.trunc(n)
}

function portFromArgv(argv: string[]): number | undefined {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--port' || arg === '-p') {
      const port = parsePort(argv[i + 1])
      if (port) return port
      continue
    }
    if (arg.startsWith('--port=')) {
      const port = parsePort(arg.slice('--port='.length))
      if (port) return port
      continue
    }
  }
}

function normalizeOrigin(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return
  try {
    return new URL(trimmed).origin
  } catch {
    if (/^https?:\/\//.test(trimmed))
      return trimmed
  }
}

function portFromDevServerUrl(value: string): number | undefined {
  try {
    const u = new URL(value)
    // Nuxt should always provide an explicit port for dev server URLs, but keep a safe fallback.
    const raw = u.port || (u.protocol === 'https:' ? '443' : '80')
    return parsePort(raw)
  } catch {
    return
  }
}

export function resolveDevtoolsAppOrigin(opts: ResolveDevtoolsAppOriginOptions = {}) {
  const normalizedOverride = opts.appOrigin ? normalizeOrigin(opts.appOrigin) : undefined
  if (normalizedOverride) return normalizedOverride

  const protocol = opts.https ? 'https' : 'http'
  const defaultPort = opts.defaultPort ?? 3000

  const devServerUrlPort = typeof opts.devServerUrl === 'string' ? portFromDevServerUrl(opts.devServerUrl) : undefined
  const nuxtPort = parsePort(opts.devServerPort)
  const argvPort = opts.argv ? portFromArgv(opts.argv) : undefined
  const envPort = opts.env
    ? (
        parsePort(opts.env.PORT)
        || parsePort(opts.env.NUXT_PORT)
        || parsePort(opts.env.NITRO_PORT)
        || parsePort(opts.env.npm_config_port)
      )
    : undefined

  // If Nuxt provides a dev server URL, trust its port (it reflects the actual listening port,
  // even when Nuxt auto-selects a non-default port because 3000 is busy).
  if (devServerUrlPort) {
    return `${protocol}://localhost:${devServerUrlPort}`
  }

  // If Nuxt port is the default (3000), but the CLI explicitly sets a port, prefer CLI.
  const port = (nuxtPort && nuxtPort !== defaultPort) ? nuxtPort : (argvPort || nuxtPort || envPort || defaultPort)

  return `${protocol}://localhost:${port}`
}
