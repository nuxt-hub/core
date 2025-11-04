import { db, schema } from 'hub:database'

export default eventHandler(async () => {
  // List todos for the current user
  return await db.query.todos.findMany({
    columns: {}
  })
})
