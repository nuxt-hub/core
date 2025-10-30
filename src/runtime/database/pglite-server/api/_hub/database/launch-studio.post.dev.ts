import { eventHandler, getQuery } from 'h3'
import { startStudioPostgresServer } from 'drizzle-kit/api'

// @ts-expect-error - dynamically generated
import { client } from 'hub:database'

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const port = Number(query.port) || 4983
  const schema = {} // Empty schema for now

  await startStudioPostgresServer(schema, {
    driver: 'pglite',
    client
  }, { port })
  return { success: true, port }
})
