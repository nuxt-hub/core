import destr from 'destr'
import { joinKeys, normalizeKey } from 'unstorage'

const incrementScript = `
local value = redis.call('INCR', KEYS[1])
if value == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return value
`

function normalizeTTL(ttl) {
  if (!Number.isFinite(ttl) || ttl <= 0) {
    throw new TypeError('Atomic KV increment requires a positive TTL in seconds.')
  }
  return Math.ceil(ttl)
}

function redisKey(options, key, upstash) {
  const base = upstash
    ? normalizeKey(options.base)
    : (options.base || '').replace(/:$/, '')
  return joinKeys(base, key)
}

function denoKey(options, key) {
  const base = options.base ? normalizeKey(options.base).split(':') : []
  return [...base, ...key.split(':')].filter(Boolean)
}

function redisOperations(driver, options, upstash) {
  const client = () => driver.getInstance()

  return {
    async getAndDelete(key) {
      return destr(await (await client()).getdel(redisKey(options, key, upstash)))
    },
    async increment(key, ttl) {
      const seconds = normalizeTTL(ttl)
      const instance = await client()
      const value = upstash
        ? await instance.eval(incrementScript, [redisKey(options, key, true)], [String(seconds)])
        : await instance.eval(incrementScript, 1, redisKey(options, key, false), String(seconds))
      return Number(value)
    }
  }
}

function denoOperations(driver, options) {
  const client = () => driver.getInstance()

  return {
    async getAndDelete(key) {
      const instance = await client()
      const resolvedKey = denoKey(options, key)
      while (true) {
        const entry = await instance.get(resolvedKey)
        const result = await instance.atomic().check(entry).delete(resolvedKey).commit()
        if (result.ok) return destr(entry.value ?? null)
      }
    },
    async increment(key, ttl) {
      const instance = await client()
      const resolvedKey = denoKey(options, key)
      const expireIn = normalizeTTL(ttl) * 1000
      while (true) {
        const entry = await instance.get(resolvedKey)
        const current = entry.versionstamp === null
          ? 0
          : typeof entry.value === 'number' || typeof entry.value === 'string'
            ? Number(entry.value)
            : Number.NaN
        if (!Number.isSafeInteger(current)) {
          throw new TypeError(`Atomic KV increment requires an integer value at "${key}".`)
        }
        const transaction = instance.atomic().check(entry)
        const result = await (entry.versionstamp === null
          ? transaction.set(resolvedKey, current + 1, { expireIn })
          : transaction.set(resolvedKey, current + 1)).commit()
        if (result.ok) return current + 1
      }
    }
  }
}

export function addAtomicKVOperations(storage, driver, driverName, options = {}) {
  const operations = driverName === 'redis'
    ? redisOperations(driver, options, false)
    : driverName === 'upstash'
      ? redisOperations(driver, options, true)
      : driverName === 'deno-kv'
        ? denoOperations(driver, options)
        : undefined

  return operations ? Object.assign(storage, operations) : storage
}
