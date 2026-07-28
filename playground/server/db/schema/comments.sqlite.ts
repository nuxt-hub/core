import { author, pages } from '@nuxthub/db/schema'
import { defineRelationsPart, sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const comments = sqliteTable('comments', {
  id: integer().primaryKey(),
  // @ts-expect-error - ignore as it depends of current dialect
  pageId: integer().references(() => pages.id),
  content: text().notNull(),
  createdAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  authorId: integer().references(() => author.id)
})

export const commentsRelations = defineRelationsPart({ comments, pages }, r => ({
  comments: {
    pages: r.one.pages({
      from: r.comments.pageId,
      to: r.pages.id
    })
  }
}))

export const authorCommentsRelations = defineRelationsPart({ comments, author }, r => ({
  author: {
    comments: r.many.comments({
      from: r.author.id,
      to: r.comments.authorId
    })
  }
}))
