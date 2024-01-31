import { useValidatedParams, z } from 'h3-zod'

export default eventHandler(async (event) => {
  // TODO: handle authorization

  const { key } = await useValidatedParams(event, {
    key: z.string().min(1)
  })

  return useBlob().get(key)
})
