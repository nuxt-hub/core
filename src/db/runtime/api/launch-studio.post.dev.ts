import { eventHandler, getQuery } from 'h3'
import { startStudioPostgresServer, startStudioSQLiteServer } from 'drizzle-kit/api'

// @ts-expect-error - dynamically generated
import { schema } from '@nuxthub/db'

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const port = Number(query.port) || 4983
  const driver = query.driver as string || 'pglite'

  if (driver === 'd1') {
    // D1 binding - access from Cloudflare runtime environment
    const binding = event.context.cloudflare?.env?.DB
      // @ts-expect-error - global env binding
      || globalThis.__env__?.DB
      // @ts-expect-error - global binding
      || globalThis.DB
      || process.env.DB

    if (!binding) {
      throw new Error('D1 binding not found. Make sure you are running with `wrangler dev` or the D1 binding is available.')
    }

    await startStudioSQLiteServer(schema, {
      driver: 'd1',
      binding
    }, { port })
  } else {
    // PGlite - use the client instance from hub:db
    // @ts-expect-error - dynamically generated
    const client = await import('@nuxthub/db').then(m => m.client)
    await startStudioPostgresServer(schema, {
      driver: 'pglite',
      client
    }, { port })
  }

  return { success: true, port }
})
