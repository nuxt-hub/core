import { serverQueryContent } from '#content/server'

export default eventHandler(async (event) => {
  const { templates } = await serverQueryContent(event, '/templates').only('templates').findOne()

  return templates.map((template: any) => ({
    slug: template.slug,
    name: template.name,
    description: template.description,
    screenshot: `https://hub.nuxt.com/public/images/templates/${template.slug}.png`,
    repo: template.repo,
    demo: template.demo,
  }))
})
