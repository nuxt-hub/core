import { eventHandler, readBody } from 'h3'
import { db } from 'hub:db'

export default eventHandler(async (event) => {
  const body = await readBody(event)
  return db.user.create({ data: body })
})
