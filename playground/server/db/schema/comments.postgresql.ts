import { pages } from 'hub:db:schema'
import { pgTable, text, timestamp, serial } from 'drizzle-orm/pg-core'
import { defineRelationsPart } from 'drizzle-orm'

export { glasses } from '../glasses'

export const comments = pgTable('comments', {
  id: serial().primaryKey(),
  // @ts-expect-error - ignore as it depends of current dialect
  pageId: serial().references(() => pages.id),
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
