
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

export interface BlogArticleAuthor extends ChangelogAuthor {}

export interface blog {
  title: string
  description: string
  date: Date
  authors: ChangelogAuthor[]
  _path: string
  img: string
}


export interface BlogArticle extends ParsedContent {
  description: string
  date: Date
  img: string
  authors: BlogArticleAuthor[]
  tags: string[]
  category: string
}

export interface Template {
  name: string
  slug: string
  description: string
  repo?: string
  demo?: string
}
