import { consola } from 'consola'
import { defineCommand } from 'citty'
import { loadConfig } from '../utils.mjs'
import { $api } from '../utils.mjs'

export default defineCommand({
  meta: {
    name: 'whoami',
    description: 'Shows the username of the currently logged in user.',
  },
  async setup() {
    const config = loadConfig()
    if (!config.token) {
      consola.info('Not currently logged in.')
      return
    }

    const user = await $api('/user').catch(() => null)
    if (!user?.name) {
      consola.info('Not currently logged in.')
      return
    }
    consola.info(`Logged in as \`${user.name}\``)
  },
})
