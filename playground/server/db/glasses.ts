import * as d from 'drizzle-orm/pg-core'

export const glasses = d.pgTable('glasses', {
  id: d.serial().primaryKey(),
  name: d.text().notNull(),
  color: d.text().notNull(),
  createdAt: d.timestamp().notNull().defaultNow(),
  updatedAt: d.timestamp().notNull().defaultNow()
})
