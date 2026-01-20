import { eventHandler, readBody } from 'h3'
import { db, schema } from 'hub:db'

export default eventHandler(async (event) => {
  const body = await readBody(event)
  const result = await db.insert(schema.users).values(body).returning()
  return result[0]
})
