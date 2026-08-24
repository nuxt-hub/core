import { defineRelationsPart } from 'drizzle-orm/relations'
import { author, comments } from 'hub:db:schema'

export const authorCommentsRelations = defineRelationsPart(
  { comments, author },
  r => ({
    author: {
      comments: r.many.comments({
        from: r.author.id,
        to: r.comments.authorId
      })
    }
  })
)
