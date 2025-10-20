import { eventHandler, createError, readValidatedBody } from 'h3'
import { sql } from 'drizzle-orm'
import z from 'zod'

const schema = z.object({
  sql: z.string(),
  params: z.array(z.any()),
  method: z.enum(['all', 'run', 'get', 'values'])
})

export default eventHandler(async (event) => {
  const { sql: sqlQuery, params, method } = await readValidatedBody(event, schema.parse)
  const sqlBody = sqlQuery.replace(/;/g, '')

  try {
    // @ts-expect-error - drizzle is generated dynamically
    const { drizzle } = await import('#hub/database')
    const db = drizzle()

    // Use Drizzle's sql.raw to execute the query
    const result = await db.execute(sql.raw(sqlBody))

    // Handle different response formats based on method
    if (method === 'get') {
      // Return first row as array of values
      const row = result.rows?.[0] || result[0]
      return row ? Object.values(row) : []
    }

    // For 'all', 'run', 'values' - return rows as array of arrays
    const rows = result.rows || result || []
    return rows.map((row: any) => Object.values(row))
  } catch (e: any) {
    console.error(`[hub:database]: ${e.message}`)
    return createError({
      statusCode: 500,
      message: 'Query Error',
      data: { error: e }
    })
  }
})
