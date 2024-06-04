import { eventHandler, sendNoContent } from 'h3'
import { requireNuxtHubAuthorization } from '../../../../../utils/auth'

export default eventHandler(async (event) => {
  // only handles CORS for Nuxt DevTools
  await requireNuxtHubAuthorization(event)
  return sendNoContent(event)
})
