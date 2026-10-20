import { eventHandler, getQuery } from 'h3'
import { blob } from 'hub:blob'
import { handleCors } from '../../utils/cors'

export default eventHandler(async (event) => {
  if (handleCors(event)) return
  const { prefix = '', limit, cursor, folded } = getQuery(event)
  return blob.list({
    prefix: prefix as string,
    limit: limit ? Number(limit) : undefined,
    cursor: cursor as string,
    folded: folded === 'true'
  })
})
