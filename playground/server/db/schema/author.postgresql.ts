import { pgTable, text, serial } from 'drizzle-orm/pg-core'

export const author = pgTable('author', {
  id: serial().primaryKey(),
  name: text().notNull()
})
