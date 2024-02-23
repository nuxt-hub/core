import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export default defineEventHandler(async () => {
  const db = useDrizzle()

  const tables = await db.all(sql`
    SELECT
      name,
      type
    FROM
      sqlite_schema
    WHERE
      type = 'table' AND
      name NOT LIKE 'sqlite_%' and name NOT LIKE '_litestream_%' and name NOT LIKE '__drizzle%'
    ;
  `)

  const todos = sqliteTable('todos', {
    id: integer('id').primaryKey(),
    text: text('text')
  })
  // const inserted = await db.insert(todos).values({ text: 'hello' }).returning().get()
  // const todo = await db.select().from(todos).where(eq(todos.id, inserted.id)).get()
  // const updated = await db.update(todos).set({ text: 'Bonjour' }).where(eq(todos.id, inserted.id)).returning()
  const all = await db.select().from(todos).limit(3)
  // const deleted = await db.delete(todos).where(eq(todos.id, all[0].id))

  return {
    tables,
    // todo,
    // inserted,
    // updated,
    // deleted,
    all
  }
})
