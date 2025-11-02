import type { comments, pages, todos } from 'hub:database:schema'

export type Comment = typeof comments.$inferSelect
export type Page = typeof pages.$inferSelect
export type Todo = typeof todos.$inferSelect
