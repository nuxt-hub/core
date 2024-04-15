import type { BlogArticle } from '~/types'

export const useBlog = () => {
  const blogArticles = useState<BlogArticle[]>('blog-articles', () => [])

  async function fetchList() {
    if (blogArticles.value.length) {
      return
    }

    try {
      const data = await queryContent<BlogArticle>('/blog')
        .where({ _extension: 'md' })
        .without(['body', 'excerpt'])
        .sort({ date: -1 })
        .find()

        blogArticles.value = (data as BlogArticle[]).filter(article => article._path !== '/blog')
    }
    catch (e) {
      blogArticles.value = []
      return e
    }
  }

  return {
    blogArticles,
    fetchList
  }
}
