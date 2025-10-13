import { eventHandler, createError, readValidatedBody } from 'h3'
import { useDatabase } from '#imports'
import z from 'zod'

const schema = z.object({
  sql: z.string(),
  params: z.array(z.any()),
  method: z.enum(['all', 'run', 'get', 'values'])
})

export default eventHandler(async (event) => {
  const { sql, params, method } = await readValidatedBody(event, schema.parse)
  const sqlBody = sql.replace(/;/g, '')

  try {
    const client = useDatabase('db')
    const result = await client.prepare(sqlBody).bind(...params)[method === 'run' ? 'run' : method === 'get' ? 'get' : 'all']()

    // convert methods except "get" into string[][] - see https://orm.drizzle.team/docs/connect-drizzle-proxy
    if (method === 'get') {
      return Object.values(result)
    }
    return result.map((result: any) => {
      return Object.values(result)
    })
  } catch (e: any) {
    console.error(e.message)
    return createError({
      statusCode: 500,
      message: 'Query Error',
      data: { error: e }
    })
  }
})
