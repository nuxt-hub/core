import { eventHandler, getValidatedRouterParams, readValidatedBody } from 'h3'
import { z } from 'zod'
import { hubDatabase } from '../../../utils/database'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'

const statementValidation = z.object({
  query: z.string().min(1).max(1e6).trim(),
  params: z.any().array().default([])
})

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('database')

  // https://developers.cloudflare.com/d1/build-databases/query-databases/
  const { command } = await getValidatedRouterParams(event, z.object({
    command: z.enum(['first', 'all', 'raw', 'run', 'exec', 'batch'])
  }).parse)
  const db = hubDatabase()

  if (command === 'exec') {
    const { query } = await readValidatedBody(event, statementValidation.pick({ query: true }).parse)
    return db.exec(query)
  }
  if (command === 'first') {
    const { query, params, colName } = await readValidatedBody(event, z.intersection(
      statementValidation,
      z.object({ colName: z.string().optional() })
    ).parse)
    if (colName) {
      return db.prepare(query).bind(...params).first(colName)
    }
    return db.prepare(query).bind(...params).first()
  }

  if (command === 'batch') {
    const statements = await readValidatedBody(event, z.array(statementValidation).parse)
    return db.batch(
      statements.map(stmt => db.prepare(stmt.query).bind(...stmt.params))
    )
  }

  if (command === 'raw') {
    const { query, params, columnNames } = await readValidatedBody(event, z.intersection(
      statementValidation,
      z.object({ columnNames: z.boolean().default(false) })
    ).parse)
    // @ts-expect-error overload on columnNames
    return db.prepare(query).bind(...params).raw({ columnNames })
  }

  // command is all or run
  const { query, params } = await readValidatedBody(event, statementValidation.parse)
  return db.prepare(query).bind(...params)[command]()
})
