import { pages, author } from '@nuxthub/db/schema'
import { int, mysqlTable, text, timestamp } from 'drizzle-orm/mysql-core'
import { defineRelationsPart } from 'drizzle-orm'

export { glasses } from '../glasses'

export const comments = mysqlTable('comments', {
  id: int().primaryKey().autoincrement(),
  // @ts-expect-error - ignore as it depends of current dialect
  pageId: int().references(() => pages.id),
  content: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  authorId: int().references(() => author.id)
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
