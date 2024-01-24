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
})