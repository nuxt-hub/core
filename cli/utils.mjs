import isDocker from 'is-docker'
import { joinURL } from 'ufo'
import { join } from 'pathe'
import XDGAppPaths from 'xdg-app-paths'
import { loadJsonFileSync } from 'load-json-file'
import { writeJsonFileSync } from 'write-json-file'
import { ofetch } from 'ofetch'

const CONFIG_DIR = XDGAppPaths('com.nuxt.hub.cli').dataDirs()[0]
const CONFIG_PATH = join(CONFIG_DIR, 'auth.json')
export const NUXT_HUB_URL = process.env.NUXT_HUB_URL || 'http://nuxthub-admin.pages.dev'

export function loadConfig() {
  try {
    return loadJsonFileSync(CONFIG_PATH)
  } catch (err) {
    return {}
  }
}
export function writeConfig (config) {
  try {
    return writeJsonFileSync(CONFIG_PATH, config, { indent: 2 })
  } catch (err) {
    console.error(`Not able to create ${CONFIG_PATH}.`, err)
  }
}

export function isHeadless() {
  return isDocker() || Boolean(process.env.SSH_CLIENT || process.env.SSH_TTY)
}

export const $api = ofetch.create({
  baseURL: joinURL(NUXT_HUB_URL, '/api'),
  headers: {
    Authorization: `token ${loadConfig().token || ''}`
  }
})
