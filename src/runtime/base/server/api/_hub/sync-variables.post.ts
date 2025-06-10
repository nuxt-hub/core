import { eventHandler, getHeader, readValidatedBody } from 'h3'
import { z } from 'zod'
import { requireNuxtHubAuthorization } from '../../../../utils/auth'

export default eventHandler(async (event) => {
  await requireNuxtHubAuthorization(event)

  const { env, keys } = await readValidatedBody(event, z.object({
    env: z.string(),
    keys: z.array(z.string())
  }).parse)

  const variables = keys.map(key => ({ key, value: process.env[key] }))

  await $fetch(`/api/projects/${process.env.NUXT_HUB_PROJECT_KEY}/variables/sync-from-deployment`, {
    baseURL: process.env.NUXT_HUB_URL || 'https://admin.hub.nuxt.com',
    method: 'POST',
    body: {
      env: process.env.NUXT_HUB_ENV || env,
      variables
    },
    headers: new Headers({
      authorization: getHeader(event, 'authorization') || ''
    })
  })

  return {
    success: true
  }
})
