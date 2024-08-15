import { Feed } from 'feed'
import { joinURL } from 'ufo'
import { serverQueryContent } from '#content/server'

export default defineEventHandler(async (event) => {
  const baseUrl = 'https://hub.nuxt.com'
  const siteUrl = joinURL(baseUrl, 'blog')
  const feed = new Feed({
    title: 'NuxtHub Blog',
    description: 'News, articles and tutorials about NuxtHub.',
    id: siteUrl,
    link: siteUrl,
    language: 'en',
    image: joinURL(baseUrl, 'icon.png'),
    favicon: joinURL(baseUrl, 'favicon.ico'),
    copyright: `Copyright © 2024-${new Date().getFullYear()} NuxtLabs All Rights Reserved`,
    feedLinks: {
      rss: `${siteUrl}/rss.xml`
    }
  })

  const articles = await serverQueryContent(event, '/blog')
    .sort({ date: -1 })
    .where({ _partial: false, draft: { $ne: true }, _type: 'markdown' })
    .find()

  for (const article of articles) {
    feed.addItem({
      link: joinURL(baseUrl, article._path!),
      image: joinURL(baseUrl, article.image),
      title: article.title!,
      date: new Date(article.date),
      description: article.description,
      author: article.authors,
      category: article.category
    })
  }

  appendHeader(event, 'Content-Type', 'application/xml')
  return feed.rss2()
})
