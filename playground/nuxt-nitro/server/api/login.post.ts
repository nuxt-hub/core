import * as z from 'zod'

// Used for the /api/chatroom endpoint
export default defineEventHandler(async (event) => {
  const { username } = await readValidatedBody(event, z.object({ username: z.string().min(1) }).parse)

  await setUserSession(event, {
    user: {
      username
    }
  })

  return {}
})
