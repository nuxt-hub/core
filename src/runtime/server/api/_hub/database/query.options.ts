import { eventHandler, sendNoContent } from 'h3'
import { requireNuxtHubAuthorization } from '../../../utils/auth'

export default eventHandler(async (event) => {
  // only handles CORs for Nuxt DevTools
  await requireNuxtHubAuthorization(event)
  return sendNoContent(event)
})
