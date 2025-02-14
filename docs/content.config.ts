import { defineContentConfig, defineCollection, z } from '@nuxt/content'

const authorSchema = z.object({
  name: z.string(),
  username: z.string(),
  to: z.string(),
  avatar: z.object({
    src: z.string(),
    alt: z.string()
  })
})

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      source: 'docs/**/*.md'
    }),
    changelog: defineCollection({
      type: 'page',
      source: 'changelog/*.md',
      schema: z.object({
        image: z.string(),
        authors: z.array(authorSchema),
        date: z.date()
      })
    }),
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        image: z.string(),
        authors: z.array(authorSchema),
        date: z.date(),
        category: z.enum(['Release', 'Tutorial'])
      })
    })
  }
})
