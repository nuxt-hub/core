import { useValidatedParams, z } from 'h3-zod'

export default eventHandler(async (event) => {
  await requireUserSession(event)
  const { key } = await useValidatedParams(event, {
    key: z.string().min(1).max(100)
  })

  // Delete entry for the current user
  const bucket = useBucket()

  return bucket.delete(key)
})
