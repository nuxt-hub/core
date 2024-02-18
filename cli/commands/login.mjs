import { consola } from 'consola'
import { defineCommand } from 'citty'
import { isHeadless, fetchUser, updateUserConfig, $api, NUXT_HUB_URL } from '../utils/index.mjs'
import { createApp, eventHandler, toNodeListener, getQuery } from 'h3'
import { getRandomPort } from 'get-port-please'
import { listen } from 'listhen'
import { withQuery, joinURL } from 'ufo'

export default defineCommand({
  meta: {
    name: 'login',
    description: 'Authenticate with NuxtHub',
  },
  async setup() {
    if (isHeadless()) {
      throw new Error('nuxthub login is not supported in Docker or SSH yet.')
    }
    const user = await fetchUser()
    if (user) {
      return consola.info(`Already logged in as \`${user.name}\``)
    }
    // Create server for OAuth flow
    let listener
    const app = createApp()
    let handled = false
    // eslint-disable-next-line no-async-promise-executor
    await new Promise(async (resolve, reject) => {
      app.use('/', eventHandler(async (event) => {
        if (handled)  return
        handled = true
        const token = getQuery(event).token

        if (token) {
          const user = await $api('/user', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }).catch(() => null)
          if (user?.name) {
            updateUserConfig({ hub: { userToken: token } })
            consola.success('Authenticated successfully!')

            resolve()

            // TODO: redirect to success CLI page: https://hub.nuxt.com/cli/login-success?name=${user.name}
            return 'Authenticated successfully! You can close this window now.'
          }
        }
        consola.error('Authentication error, please try again.')
        reject()
        return 'Authentication error, missing token.'
      }))
      const randomPort = await getRandomPort()
      listener = await listen(toNodeListener(app), {
        showURL: false,
        port: randomPort
      })
      consola.box(
        'Please visit the following URL in your web browser:\n\n'+
        '`'+withQuery(joinURL(NUXT_HUB_URL, '/api/cli/authorize'), { redirect: listener.url })+'`'
      )
      consola.info('Waiting for authentication to be completed...')
    })
    // Close server after 1s to make sure we have time to handle the request
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await listener.close()
  },
})
