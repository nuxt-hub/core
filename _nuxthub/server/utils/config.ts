import type { Storage } from 'unstorage'
import { defu } from 'defu'
import { createStorage } from 'unstorage'
import httpDriver from 'unstorage/drivers/http'
import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'
import { joinURL } from 'ufo'

const defaults: Config = {
  oauth: {
    github: {
      clientId: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET
    }
  },
  public: {
    features: {
      // users features
    }
  }
}

let _configKV: Storage

export function useConfigKV () {
  if (!_configKV) {
    if (import.meta.dev && process.env.NUXT_HUB_URL) {
      // Use https://unstorage.unjs.io/drivers/http
      _configKV = createStorage({
        driver: httpDriver({
          base: joinURL(process.env.NUXT_HUB_URL, '/api/_hub/config/'),
          headers: {
            Authorization: `Bearer ${process.env.NUXT_HUB_SECRET_KEY}`
          }
        })
      })
    } else {
      const binding = process.env.CONFIG || globalThis.__env__?.CONFIG || globalThis.CONFIG
      if (binding) {
        _configKV = createStorage({
          driver: cloudflareKVBindingDriver({
            binding
          })
        })
      } else {
        throw createError('Missing Cloudflare binding CONFIG')
      }
    }
  }

  return _configKV
}

let _config: Config

export async function _fetchConfig() {
  let configValue = await useConfigKV().getItem<Config>('config')
  configValue = z.custom<Config>().parse(configValue)
  _config = defu(configValue, defaults)

  return _config
}

export function getConfig() {
  if (!_config) {
    throw createError('Please run _fetchConfig() in order to use useConfig()')
  }

  return _config
}

export async function setConfig(config: Config) {
  if (!_config) {
    throw createError('Please run _fetchConfig() in order to use setConfig()')
  }

  let configValue = z.custom<Config>().parse(config)
  configValue = defu(config, _config)
  await useConfigKV().setItem('config', configValue)
  _config = configValue

  return _config
}
