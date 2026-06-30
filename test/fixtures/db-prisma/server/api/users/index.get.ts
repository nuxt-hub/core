import { eventHandler } from 'h3'
import { db } from 'hub:db'

export default eventHandler(async () => {
  return db.user.findMany()
})
