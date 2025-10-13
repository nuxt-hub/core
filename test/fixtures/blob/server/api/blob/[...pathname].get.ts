import { eventHandler, getValidatedRouterParams } from 'h3'
import * as z from 'zod'
import { hubBlob } from '#imports'

export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  return hubBlob().serve(event, pathname)
})
