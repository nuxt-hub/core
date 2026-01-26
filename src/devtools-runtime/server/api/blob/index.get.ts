import { eventHandler, getQuery } from 'h3'
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  const { prefix = '', limit, cursor, folded } = getQuery(event)
  return blob.list({
    prefix: prefix as string,
    limit: limit ? Number(limit) : undefined,
    cursor: cursor as string,
    folded: folded === 'true'
  })
})
