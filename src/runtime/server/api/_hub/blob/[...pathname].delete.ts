import { eventHandler, getValidatedRouterParams } from 'h3'
import { z } from 'zod'
import { useBlob } from '../../../utils/blob'

export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  await useBlob().delete(pathname)

  return sendNoContent(event)
})
