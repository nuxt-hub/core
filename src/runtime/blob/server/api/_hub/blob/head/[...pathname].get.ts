import { eventHandler, getValidatedRouterParams } from 'h3'
import { z } from 'zod'
import { hubBlob } from '../../../../utils/blob'
import { requireNuxtHubAuthorization } from '../../../../../../utils/auth'
import { requireNuxtHubFeature } from '../../../../../../utils/features'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)
  requireNuxtHubFeature('blob')

  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  return hubBlob().head(pathname)
})
