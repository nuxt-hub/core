import isDocker from 'is-docker'
import { joinURL } from 'ufo'
import { ofetch } from 'ofetch'
import { updateUser, readUser, writeUser, read, update } from 'rc9'
import { homedir } from 'os'

export const INITIAL_CONFIG = loadUserConfig()
export const NUXT_HUB_URL = process.env.NUXT_HUB_URL || INITIAL_CONFIG.hub?.url || 'https://hub.nuxt.com'

export function loadUserConfig () {
  return readUser('.nuxtrc')
}
export function updateUserConfig (config) {
  return updateUser(config, '.nuxtrc')
}
export function writeUserConfig (config) {
  return writeUser(config, '.nuxtrc')
}
export function loadProjectConfig () {
  return read('.nuxtrc')
}
export function updateProjectConfig (config) {
  return update(config, '.nuxtrc')
}

export function isHeadless() {
  return isDocker() || Boolean(process.env.SSH_CLIENT || process.env.SSH_TTY)
}

export function projectPath() {
  return process.cwd().replace(homedir(), '~')
}

export const $api = ofetch.create({
  baseURL: joinURL(NUXT_HUB_URL, '/api'),
  onRequest({ options }) {
    options.headers = options.headers || {}
    if (!options.headers.Authorization) {
      options.headers.Authorization = `token ${loadUserConfig().hub?.userToken || ''}`
    }
  }
})
