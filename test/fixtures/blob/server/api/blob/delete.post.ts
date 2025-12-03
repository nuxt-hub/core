import { eventHandler, readValidatedBody, sendNoContent } from 'h3'
import * as z from 'zod'
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  const { pathnames } = await readValidatedBody(event, z.object({
    pathnames: z.array(z.string().min(1)).min(1)
  }).parse)

  await blob.delete(pathnames)
  return sendNoContent(event)
})
