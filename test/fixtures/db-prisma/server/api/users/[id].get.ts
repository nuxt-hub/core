import { eventHandler, getRouterParam, createError } from 'h3'
import { db } from 'hub:db'

export default eventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const user = await db.user.findUnique({ where: { id } })
  if (!user) throw createError({ statusCode: 404, message: 'User not found' })
  return user
})
