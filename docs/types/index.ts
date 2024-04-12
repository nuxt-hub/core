
import type { ParsedContent } from '@nuxt/content/dist/runtime/types'
export interface ChangelogAuthor {
  name: string
  avatarUrl: string
  link: string
  twitter: string
}

export interface Changelog {
  title: string
  description: string
  date: Date
  authors: ChangelogAuthor[]
  _path: string
  img: string
}


export interface ChangelogArticle extends ParsedContent {
  title: string
  description: string
  date: Date
  authors: ChangelogAuthor[]
  img: string
}
