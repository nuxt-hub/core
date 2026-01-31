import { eventHandler, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default eventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const result = await db.select().from(schema.users).where(eq(schema.users.id, id))
  if (!result.length) throw createError({ statusCode: 404, message: 'User not found' })
  return result[0]
})
