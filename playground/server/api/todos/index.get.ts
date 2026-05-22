import { db } from '@nuxthub/db'

export default eventHandler(async () => {
  // List todos for the current user
  return await db.query.todos.findMany({
    where: {
      completed: false
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
})
