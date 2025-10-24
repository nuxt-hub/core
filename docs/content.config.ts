import { defineContentConfig, defineCollection, z } from '@nuxt/content'

const Button = z.object({
  label: z.string(),
  icon: z.string(),
  trailingIcon: z.string(),
  to: z.string(),
  color: z.enum(['primary', 'neutral']).optional(),
  size: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
  variant: z.enum(['solid', 'outline', 'subtle', 'link']).optional(),
  id: z.string().optional(),
  target: z.enum(['_blank', '_self']).optional()
})

const Author = z.object({
  name: z.string(),
  description: z.string().optional(),
  username: z.string().optional(),
  to: z.string().optional(),
  avatar: z.object({
    src: z.string(),
    alt: z.string()
  }).optional()
})

const Testimonial = z.object({
  quote: z.string(),
  author: Author
})

const PageFeature = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string().editor({ input: 'icon' }),
  to: z.string().optional(),
  target: z.enum(['_blank', '_self']).optional(),
  soon: z.boolean().optional()
})

const PageSection = z.object({
  title: z.string(),
  description: z.string(),
  links: z.array(Button),
  features: z.array(PageFeature),
  image: z.object({
    light: z.string().editor({ input: 'media' }),
    dark: z.string().editor({ input: 'media' }),
    width: z.number().optional(),
    height: z.number().optional()
  })
})

const PageHero = z.object({
  title: z.string(),
  description: z.string(),
  image: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    light: z.string().editor({ input: 'media' }),
    dark: z.string().editor({ input: 'media' })
  }).optional(),
  headline: z.object({
    label: z.string(),
    to: z.string(),
    icon: z.string().optional().editor({ input: 'icon' })
  }).optional(),
  links: z.array(Button).optional()
})

export default defineContentConfig({
  collections: {
    index: defineCollection({
      type: 'data',
      source: 'index.yml',
      schema: z.object({
        title: z.string(),
        navigation: z.boolean(),
        description: z.string(),
        hero: PageHero,
        features: z.array(PageFeature),
        testimonial: Testimonial,
        tool: PageSection,
        deploy: PageSection.extend({
          steps: z.array(z.object({
            title: z.string(),
            description: z.string(),
            image: z.object({
              light: z.string().editor({ input: 'media' }),
              dark: z.string().editor({ input: 'media' }),
              width: z.number().optional(),
              height: z.number().optional()
            })
          }))
        }),
        fullStack: PageSection,
        sections: z.array(PageSection),
        testimonials: PageSection.extend({
          items: z.array(Testimonial)
        })
      })
    }),
    docs: defineCollection({
      type: 'page',
      source: 'docs/**/*',
      schema: z.object({
        links: z.array(Button)
      })
    }),
    changelog: defineCollection({
      type: 'page',
      source: 'changelog/**/*',
      schema: z.object({
        image: z.string().editor({ input: 'media' }),
        authors: z.array(Author),
        date: z.string().date()
      })
    }),
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*',
      schema: z.object({
        image: z.string().editor({ input: 'media' }),
        authors: z.array(Author),
        date: z.string().date(),
        category: z.enum(['Release', 'Tutorial'])
      })
    }),
    templates: defineCollection({
      type: 'data',
      source: 'templates.yml',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string().editor({ input: 'icon' }),
        hero: PageHero
      })
    }),
    pages: defineCollection({
      type: 'page',
      source: '*.md'
    })
  }
})
