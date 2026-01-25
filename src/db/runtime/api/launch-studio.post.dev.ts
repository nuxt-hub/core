import { eventHandler, getQuery } from 'h3'
import { startStudioPostgresServer, startStudioSQLiteServer } from 'drizzle-kit/api'

// @ts-expect-error - dynamically generated
import { db, schema } from 'hub:db'

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const port = Number(query.port) || 4983
  const driver = query.driver as string || 'pglite'

  if (driver === 'd1') {
    const binding = event.context.cloudflare?.env?.DB
      // @ts-expect-error - global env binding
      || globalThis.__env__?.DB
      // @ts-expect-error - global binding
      || globalThis.DB

    if (!binding) {
      throw new Error('D1 binding not found. Make sure you are running with `wrangler dev` or the D1 binding is available.')
    }

    await startStudioSQLiteServer(schema, {
      driver: 'd1',
      binding
    }, { port })
  } else {
    await startStudioPostgresServer(schema, {
      driver: 'pglite',
      client: db
    }, { port })
  }

  return { success: true, port }
})
