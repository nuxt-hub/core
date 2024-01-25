import { useValidatedParams, z } from 'h3-zod'

export default eventHandler(async (event) => {
  const { key } = await useValidatedParams(event, {
    key: z.string().min(1).max(100)
  })
  const session = await requireUserSession(event)

  // Delete entry for the current user
  const storage = await useKV(String(session.user!.id))

  await storage.removeItem(key)

  return { key }
})
