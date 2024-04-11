import { eventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { hubDatabase } from '../../../utils/database'
import { requireNuxtHubAuthorization } from '../../../utils/auth'
import { requireNuxtHubFeature } from '../../../utils/features'

const statementValidation = z.object({
  query: z.string().min(1).max(1e6).trim(),
  params: z.any().array().optional().default([]),
  mode: z.enum(['raw', 'all']).optional().default('all'),
})

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('database')
  
  const { query, params, mode } = await readValidatedBody(event, statementValidation.parse)

  return hubDatabase().prepare(query).bind(...params)[mode === 'raw' ? 'raw' : 'all']({ columnNames: true })
})
