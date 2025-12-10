import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const glasses = pgTable('glasses', {
  id: serial().primaryKey(),
  name: text().notNull(),
  color: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
