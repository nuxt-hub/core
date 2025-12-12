import { defineEventHandler, getQuery } from 'h3'
import { useImage } from '#imports'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const driver = typeof query.driver === 'string' ? query.driver : undefined
  const width = typeof query.w === 'string' ? Number(query.w) : 300
  const quality = typeof query.q === 'string' ? Number(query.q) : 80
  const src = typeof query.src === 'string' ? query.src : '/images/photo.jpg'

  const img = useImage(event)
  const url = img(src, { width, quality }, { provider: 'nuxthub', driver })

  return { url }
})
