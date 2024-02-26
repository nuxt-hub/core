import { eventHandler, getValidatedRouterParams, readValidatedBody } from 'h3'
import { z } from 'zod'
import { hubDatabase } from '../../../utils/database'

const statementValidation = z.object({
  query: z.string().min(1).max(1e6).trim(),
  params: z.any().array(),
})

export default eventHandler(async (event) => {
  // https://developers.cloudflare.com/d1/build-databases/query-databases/
  const { command } = await getValidatedRouterParams(event, z.object({
    command: z.enum(['first', 'all', 'raw', 'run', 'dump', 'exec', 'batch'])
  }).parse)
  const db = hubDatabase()

  if (command === 'exec') {
    const { query } = await readValidatedBody(event, z.object({
      query: z.string().min(1).max(1e6).trim()
    }).parse)
    return db.exec(query)
  }
  if (command === 'dump') {
    return db.dump()
  }
  if (command === 'first') {
    const { query, params, colName } = await readValidatedBody(event, z.object({
      query: z.string().min(1).max(1e6).trim(),
      params: z.any().array(),
      colName: z.string()
    }).parse)
    return db.prepare(query).bind(...params).first(colName)
  }

  if (command === 'batch') {
    const statements = await readValidatedBody(event, z.array(z.object({
      query: z.string().min(1).max(1e6).trim(),
      params: z.any().array(),
    })).parse)
    return db.batch(
      statements.map(stmt => db.prepare(stmt.query).bind(...stmt.params))
    )
  }

  if (command === 'raw') {
    const { query, params, columnNames } = await readValidatedBody(event, z.object({
      query: z.string().min(1).max(1e6).trim(),
      params: z.any().array(),
      columnNames: z.boolean().default(false)
    }).parse)
    // @ts-ignore
    return db.prepare(query).bind(...params).raw({ columnNames })
  }

  // command is all or run
  const { query, params } = await readValidatedBody(event, statementValidation.parse)
  return db.prepare(query).bind(...params)[command]()
})
