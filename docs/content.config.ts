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
      source: 'docs/**/*',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        links: z.array(z.object({
          label: z.string(),
          trailingIcon: z.string(),
          color: z.string(),
          to: z.string(),
          external: z.boolean()
        }))
      })
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
    }),
    pricing: defineCollection({
      type: 'data',
      source: 'pricing.yml',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string(),
        hero: z.object({
          headline: z.string(),
          title: z.string(),
          description: z.string(),
          orientation: z.string(),
          img: z.object({
            width: z.string(),
            height: z.string(),
            light: z.string(),
            dark: z.string()
          })
        }),
        pricing: z.object({
          plans: z.array(z.object({
            title: z.string(),
            description: z.string(),
            price: z.union([z.string(), z.object({
              monthly: z.string(),
              yearly: z.string()
            })]),
            cycle: z.union([z.string(), z.object({
              monthly: z.string(),
              yearly: z.string()
            })]),
            highlight: z.boolean().optional(),
            scale: z.boolean().optional(),
            features: z.array(z.object({
              title: z.string(),
              icon: z.string()
            })),
            button: z.object({
              label: z.string(),
              color: z.string().optional(),
              to: z.string()
            }),
            ui: z.object({
              inner: z.string(),
              body: z.object({
                background: z.string()
              })
            }).optional()
          })),
          info: z.string(),
          contact: z.object({
            title: z.string(),
            description: z.string(),
            button: z.object({
              label: z.string(),
              color: z.string(),
              to: z.string()
            })
          })
        }),
        cloudflare: z.object({
          title: z.string(),
          description: z.string(),
          button: z.object({
            label: z.string(),
            external: z.boolean(),
            variant: z.string(),
            padded: z.boolean(),
            trailingIcon: z.string(),
            color: z.string(),
            to: z.string()
          })
        }),
        faq: z.object({
          title: z.string(),
          description: z.string(),
          items: z.array(z.object({
            label: z.string(),
            content: z.string()
          }))
        })
      })
    }),
    cloudflarePricing: defineCollection({
      type: 'data',
      source: 'cloudflare-pricing.yml',
      schema: z.object({
        plans: z.array(z.object({
          label: z.string(),
          icon: z.string(),
          slot: z.string(),
          buttons: z.array(z.object({
            label: z.string(),
            to: z.string().url()
          })),
          columns: z.array(z.object({
            key: z.string(),
            label: z.string()
          })),
          rows: z.array(z.object({
            title: z.string(),
            free: z.string(),
            paid: z.string()
          }))
        }))
      })
    })
  }
})
