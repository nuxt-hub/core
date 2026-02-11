import { int, mysqlTable, text } from 'drizzle-orm/mysql-core'

export const author = mysqlTable('author', {
  id: int().primaryKey().autoincrement(),
  name: text().notNull()
})
