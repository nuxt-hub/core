import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

export interface Author {
  name: string
  avatar: {
    src: string
  }
  to: string
  username: string
}

export interface ChangelogPost extends ParsedContent {
  title: string
  description: string
  date: string
  image: string
  authors: Author[]
}

export interface BlogPost extends ParsedContent {
  title: string
  description: string
  date: string
  image: string
  authors: Author[]
  category: string
}

export interface Template {
  title: string
  slug: string
  description: string
  repo?: string
  demoUrl?: string
  imageUrl?: string
}
