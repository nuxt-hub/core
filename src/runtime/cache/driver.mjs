import { createError } from 'h3'
import { defineDriver, joinKeys } from 'unstorage'

let _binding
const getCacheBinding = (name = 'CACHE') => {
  if (!_binding) {
    _binding = process.env[name] || globalThis.__env__?.[name] || globalThis[name]
    if (!_binding) {
      throw createError('Missing Cloudflare CACHE binding (KV)')
    }
  }
  return _binding
}

export default defineDriver((opts = {}) => {
  const r = (key = '') => (opts.base ? joinKeys(opts.base, key) : key)

  async function getKeys(base = '') {
    base = r(base)
    const binding = getCacheBinding(opts.binding)
    const keys = []
    let cursor = undefined
    do {
      const kvList = await binding.list({ prefix: base || undefined, cursor })

      keys.push(...kvList.keys)
      cursor = (kvList.list_complete ? undefined : kvList.cursor)
    } while (cursor)

    return keys.map(key => key.name)
  }

  return {
    name: 'nuxthub-cache',
    options: opts,
    getInstance: () => getCacheBinding(opts.binding),
    async hasItem(key) {
      key = r(key)
      const binding = getCacheBinding(opts.binding)
      return (await binding.get(key)) !== null
    },
    getItem(key) {
      key = r(key)
      const binding = getCacheBinding(opts.binding)
      return binding.get(key)
    },
    setItem(key, value) {
      // value.expires is a timestamp
      key = r(key)
      const binding = getCacheBinding(opts.binding)
      const options = {}
      try {
        const json = JSON.parse(value)
        if (typeof json?.expires === 'number') {
          // expiration must be at least 1 minute from now
          // https://developers.cloudflare.com/kv/api/write-key-value-pairs/#expiring-keys
          options.expiration = Math.max(json.expires, Date.now() + 60000) / 1000
        }
        options.metadata = {
          expires: json.expires,
          mtime: json.mtime,
          size: value.length,
          integrity: json.integrity
        }
      // eslint-disable-next-line no-unused-vars
      } catch (_err) {
        // ignore
      }
      return binding.put(
        key,
        value,
        options
      )
    },
    removeItem(key) {
      key = r(key)
      const binding = getCacheBinding(opts.binding)
      return binding.delete(key)
    },
    getKeys(base) {
      return getKeys(base).then(keys =>
        keys.map(key => (opts.base ? key.slice(opts.base.length) : key))
      )
    },
    async clear(base) {
      const binding = getCacheBinding(opts.binding)
      const keys = await getKeys(base)
      await Promise.all(keys.map(key => binding.delete(key)))
    }
  }
})
