import { eventHandler } from 'h3'
import { db, schema } from 'hub:db'

export default eventHandler(async () => {
  return db.select().from(schema.users)
})
