import { defineContentConfig, defineCollection, z, defineCollectionSource } from '@nuxt/content'

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
      source: 'docs/**/*'
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
    }),
    templates: defineCollection({
      type: 'data',
      source: 'templates.yml',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string(),
        hero: z.object({
          title: z.string(),
          description: z.string(),
          align: z.enum(['left', 'center', 'right']),
          links: z.array(z.object({
            label: z.string(),
            trailingIcon: z.string(),
            color: z.string(),
            to: z.string(),
            external: z.boolean()
          }))
        })
      })
    })
  }
})
