import type { H3Event } from 'h3'
import type { Storage } from 'unstorage'
import { defu } from 'defu'
import { createStorage } from 'unstorage'
import httpDriver from 'unstorage/drivers/http'
import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'
import { joinURL } from 'ufo'

let _configKV: Storage

export function useConfigKV() {
  if (_configKV) {
    return _configKV
  }
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
    return _configKV
  }
  // @ts-ignore
  const binding = process.env.CONFIG || globalThis.__env__?.CONFIG || globalThis.CONFIG
  if (!binding) {
    throw createError('Missing Cloudflare binding CONFIG (KV)')
  }
  _configKV = createStorage({
    driver: cloudflareKVBindingDriver({
      binding
    })
  })

  return _configKV
}

let _config: HubConfig

export async function _fetchConfig(event: H3Event) {
  const runtimeConfig = useRuntimeConfig(event)
  let configValue = await useConfigKV().getItem<HubConfig>('config')
  configValue = z.custom<HubConfig>().parse(configValue)
  _config = defu(configValue, {
    oauth: {
      redirect: '/',
      ...runtimeConfig.oauth
    },
    public: {
      features: {
        // users features
      }
    }
  } as HubConfig)

  return _config
}

export function getConfig() {
  if (!_config) {
    throw createError('Please run _fetchConfig() in order to use useConfig()')
  }

  return _config
}

export async function setConfig(config: HubConfig) {
  if (!_config) {
    throw createError('Please run _fetchConfig() in order to use setConfig()')
  }

  let configValue = z.custom<HubConfig>().parse(config)
  configValue = defu(config, _config)
  await useConfigKV().setItem('config', configValue)
  _config = configValue

  return _config
}
