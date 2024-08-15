import { Feed } from 'feed'
import { joinURL } from 'ufo'
import { serverQueryContent } from '#content/server'

export default defineEventHandler(async (event) => {
  const baseUrl = 'https://hub.nuxt.com'
  const siteUrl = joinURL(baseUrl, 'changelog')
  const feed = new Feed({
    title: 'NuxtHub Changelog',
    description: 'The latest releases and updates about NuxtHub.',
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

  const changelogItems = await serverQueryContent(event, '/changelog')
    .sort({ date: -1 })
    .where({ _partial: false, _type: 'markdown' })
    .find()

  for (const item of changelogItems) {
    feed.addItem({
      link: joinURL(baseUrl, item._path!),
      image: joinURL(baseUrl, item.image),
      title: item.title!,
      date: new Date(item.date),
      description: item.description,
      author: item.authors,
      category: item.category
    })
  }

  appendHeader(event, 'Content-Type', 'application/xml')
  return feed.rss2()
})
