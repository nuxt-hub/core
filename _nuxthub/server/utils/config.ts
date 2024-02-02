import { defu } from 'defu'

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

let _config: Config

export async function _fetchConfig() {
  let configValue = await useKV().getItem<Config>('_config')
  configValue = z.custom<Config>().parse(configValue)
  _config = defu(configValue, defaults)

  return _config
}

export function useConfig() {
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
  await useKV().setItem('_config', configValue)
  _config = configValue

  return _config
}
