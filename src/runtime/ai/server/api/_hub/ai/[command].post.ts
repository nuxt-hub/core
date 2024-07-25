import { eventHandler, getValidatedRouterParams, readValidatedBody } from 'h3'
import { z } from 'zod'
import { hubAI } from '../../../utils/ai'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../utils/features'

const statementValidation = z.object({
  model: z.string().min(1).max(1e6).trim(),
  params: z.record(z.string(), z.any()).optional()
})

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('ai')

  // https://developers.cloudflare.com/workers-ai/configuration/bindings/#methods
  const { command } = await getValidatedRouterParams(event, z.object({
    command: z.enum(['run'])
  }).parse)
  const ai = hubAI()

  if (command === 'run') {
    const { model, params } = await readValidatedBody(event, statementValidation.pick({ model: true, params: true }).parse)
    // @ts-expect-error Ai type defines all the compatible models, however Zod is only validating for string
    return ai.run(model, params)
  }
})
