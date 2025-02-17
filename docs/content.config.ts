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
    index: defineCollection({
      type: 'data',
      source: 'index.yml',
      schema: z.object({
        title: z.string(),
        navigation: z.boolean(),
        description: z.string(),
        hero: z.object({
          title: z.string(),
          description: z.string(),
          img: z.object({
            width: z.string(),
            height: z.string(),
            light: z.string(),
            dark: z.string()
          }),
          headline: z.object({
            label: z.string(),
            to: z.string(),
            icon: z.string()
          })
        }),
        features: z.array(z.object({
          name: z.string(),
          description: z.string(),
          icon: z.string(),
          to: z.string().optional(),
          soon: z.boolean().optional()
        })),
        creator: z.object({
          quote: z.string(),
          author: z.object({
            name: z.string(),
            description: z.string(),
            to: z.string(),
            avatar: z.object({
              src: z.string(),
              loading: z.string()
            })
          })
        }),
        tool: z.object({
          title: z.string(),
          description: z.string(),
          links: z.array(z.object({
            label: z.string(),
            'trailing-icon': z.string(),
            to: z.string(),
            external: z.boolean().optional(),
            color: z.string(),
            size: z.string(),
            variant: z.string().optional(),
            id: z.string().optional(),
            target: z.string().optional()
          })),
          features: z.array(z.object({
            title: z.string(),
            description: z.string(),
            icon: z.string()
          }))
        }),
        deploy: z.object({
          title: z.string(),
          description: z.string(),
          steps: z.array(z.object({
            title: z.string(),
            description: z.string(),
            img: z.object({
              srcLight: z.string(),
              srcDark: z.string(),
              width: z.number(),
              height: z.number()
            })
          })),
          links: z.array(z.object({
            label: z.string(),
            'trailing-icon': z.string(),
            color: z.string(),
            size: z.string(),
            to: z.string(),
            variant: z.string().optional(),
            target: z.string().optional(),
            id: z.string().optional()
          }))
        }),
        fullStack: z.object({
          title: z.string(),
          description: z.string()
        }),
        sections: z.array(z.object({
          title: z.string(),
          description: z.string(),
          img: z.object({
            srcDark: z.string(),
            srcLight: z.string(),
            width: z.number(),
            height: z.number()
          }),
          headline: z.object({
            title: z.string(),
            icon: z.string()
          }),
          features: z.array(z.object({
            title: z.string(),
            icon: z.string()
          })),
          links: z.array(z.object({
            label: z.string(),
            'trailing-icon': z.string(),
            color: z.string(),
            variant: z.string(),
            size: z.string(),
            to: z.string()
          }))
        })),
        testimonials: z.object({
          title: z.string(),
          description: z.string(),
          items: z.array(z.object({
            quote: z.string(),
            author: z.object({
              name: z.string(),
              description: z.string(),
              avatar: z.object({
                src: z.string(),
                loading: z.string()
              })
            })
          }))
        })
      })
    }),
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
            price: z.object({
              monthly: z.string(),
              yearly: z.string()
            }),
            billingCycle: z.object({
              monthly: z.string(),
              yearly: z.string()
            }).optional(),
            highlight: z.boolean().optional(),
            scale: z.boolean().optional(),
            features: z.array(z.object({
              title: z.string(),
              icon: z.string()
            })),
            button: z.object({
              label: z.string(),
              color: z.enum(['primary', 'neutral']).optional(),
              to: z.string()
            }),
            ui: z.object({
              root: z.string().optional()
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
            color: z.enum(['primary', 'neutral']).optional(),
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
