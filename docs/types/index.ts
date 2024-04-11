
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
  image: string
  authors: ChangelogAuthor[]
  _path: string
  img: string
}
