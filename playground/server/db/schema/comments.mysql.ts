import { pages } from 'hub:db:schema'
import { int, mysqlTable, text, timestamp } from 'drizzle-orm/mysql-core'
import { defineRelationsPart } from 'drizzle-orm'

export { glasses } from '../glasses'

export const comments = mysqlTable('comments', {
  id: int().primaryKey().autoincrement(),
  // @ts-expect-error - ignore as it depends of current dialect
  pageId: int().references(() => pages.id),
  content: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})

export const commentsRelations = defineRelationsPart({ comments, pages }, r => ({
  comments: {
    pages: r.one.pages({
      from: r.comments.pageId,
      to: r.pages.id
    })
  }
}))
