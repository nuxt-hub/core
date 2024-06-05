import { eventHandler, sendNoContent } from 'h3'
import { requireNuxtHubAuthorization } from '../../../../utils/auth'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)

  return sendNoContent(event)
})
