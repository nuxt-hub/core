import { eventHandler, readValidatedBody, sendNoContent } from 'h3'
import { z } from 'zod'

export default eventHandler(async (event) => {
  const { pathnames } = await readValidatedBody(event, z.object({
    pathnames: z.array(z.string().min(1)).min(1)
  }).parse)

  await hubBlob().delete(pathnames)

  return sendNoContent(event)
})
