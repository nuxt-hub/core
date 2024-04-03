import { eventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { hubDatabase } from '../../../utils/database'

const statementValidation = z.object({
  query: z.string().min(1).max(1e6).trim(),
  params: z.any().array().optional().default([]),
  mode: z.enum(['raw', 'all']).optional().default('all'),
})

export default eventHandler(async (event) => {
  const { query, params, mode } = await readValidatedBody(event, statementValidation.parse)

  return hubDatabase().prepare(query).bind(...params)[mode === 'raw' ? 'raw' : 'all']({ columnNames: true })
})
