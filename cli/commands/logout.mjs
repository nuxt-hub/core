import { consola } from 'consola'
import { defineCommand } from 'citty'
import { loadConfig, writeConfig } from '../utils.mjs'
import { $api } from '../utils.mjs'

export default defineCommand({
  meta: {
    name: 'logout',
    description: 'Logout the current authenticated user.',
  },
  async setup() {
    const config = loadConfig()
    if (!config.token) {
      consola.info('Not currently logged in.')
      return
    }

    writeConfig({
      ...config,
      token: ''
    })
    await $api('/user/token', {
      method: 'DELETE'
    }).catch(() => {})
    consola.info('You have been logged out.')
  },
})
