import { desc, eq } from 'drizzle-orm'
import { db } from '@nuxthub/db'

export default eventHandler(async () => {
  // List todos for the current user
  return await db.query.todos.findMany({
    where: eq(schema.todos.completed, false),
    orderBy: [desc(schema.todos.createdAt)]
  })
})
