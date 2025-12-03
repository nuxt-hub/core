import { eventHandler, getValidatedRouterParams, sendNoContent } from 'h3'
import * as z from 'zod'
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  await blob.delete(pathname)
  return sendNoContent(event)
})
