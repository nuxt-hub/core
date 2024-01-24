import { z } from 'zod'

export default eventHandler(async (event) => {
  const { sql, params, method } = await readValidatedBody(event, z.object({
    sql: z.string(),
    params: z.array(z.any()),
    method: z.enum(['all', 'get', 'run', 'values'])
  }).parse)

  // Make sure the client is initialized first
  useDatabase()
  const client = useDatabaseClient()

  if (process.dev) {
    try {
      if (method === 'run')
        return client.prepare(sql).run(params)
      if (method === 'all' || method === 'values')
        return client.prepare(sql).raw().all(params)
      // method = 'get'
      return client.prepare(sql).raw().get(params)
    } catch (e: any) {
      throw createError({
        statusCode: 500,
        message: `Database error: ${e.message}`
      })
    }
  }
  try {
    if (method === 'run') {
      const { meta } = await client.prepare(sql).bind(...params).run()
      return meta
    }
    if (method === 'all' || method === 'values') {
      const { results } = await client.prepare(sql).bind(...params).raw()
      return results
    }
    // method = 'get'
    const { results } = await client.prepare(sql).bind(...params).raw()
    return results[0]
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      message: `Database error: ${e.message}`
    })
  }
})