import { eventHandler, getRouterParam, createError } from 'h3'
import { db } from 'hub:db'

export default eventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  try {
    await db.user.delete({ where: { id } })
    return { success: true }
  } catch {
    throw createError({ statusCode: 404, message: 'User not found' })
  }
})
