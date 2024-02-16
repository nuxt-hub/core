import { consola } from 'consola'
import { defineCommand, runCommand } from 'citty'
import { loadConfig, isHeadless, writeConfig, $api } from '../utils.mjs'
import { createApp, eventHandler, toNodeListener, getQuery } from 'h3'
import { getRandomPort } from 'get-port-please'
import { listen } from 'listhen'
import { withQuery, joinURL } from 'ufo'
import { NUXT_HUB_URL } from '../utils.mjs'
import whoami from './whoami.mjs'

export default defineCommand({
  meta: {
    name: 'login',
    description: 'Authenticate with NuxtHub',
  },
  async setup() {
    if (isHeadless()) {
      throw new Error('nuxthub login is not supported in Docker or SSH yet.')
    }
    const config = loadConfig()
    if (config.token) {
      return runCommand(whoami, {})
    }
    // Create server for OAuth flow
    let listener
    const stopListener = () => setTimeout(() => listener.close(), 1000)
    const app = createApp()
    let handled = false
    app.use('/', eventHandler(async (event) => {
      if (handled)  return
      handled = true
      const token = getQuery(event).token

      if (token) {
        const user = await $api('/user').catch(() => null)
        if (user?.name) {
          writeConfig({ token })
          consola.success('Authenticated successfully!')

          stopListener()

          // TODO: redirect to success CLI page: https://hub.nuxt.com/cli/login-success?name=${user.name}
          return 'Authenticated successfully! You can close this window now.'
        }
      }
      consola.error('Authentication error, please try again.')
      stopListener()
      return 'Authentication error, missing token.'
    }))
    const randomPort = await getRandomPort()
    listener = await listen(toNodeListener(app), {
      showURL: false,
      port: randomPort
    })
    consola.box(
      'Please visit the following URL in your web browser:\n\n'+
      withQuery(joinURL(NUXT_HUB_URL, '/api/cli/authorize'), { redirect: listener.url })
    )
    consola.info('Waiting for authentication to be completed...')
  },
})
