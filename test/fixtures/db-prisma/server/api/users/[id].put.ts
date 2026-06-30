import { eventHandler, getRouterParam, readBody, createError } from 'h3'
import { db } from 'hub:db'

export default eventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  try {
    return await db.user.update({ where: { id }, data: body })
  } catch {
    throw createError({ statusCode: 404, message: 'User not found' })
  }
})
