import { eventHandler, getValidatedRouterParams, setHeader, sendNoContent } from 'h3'
import { z } from 'zod'

export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  const blob = await hubBlob().head(pathname)

  setHeader(event, 'x-blob', JSON.stringify(blob))

  return sendNoContent(event)
})
