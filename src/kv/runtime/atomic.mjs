import { joinKeys } from 'unstorage'

const getAndDeleteScript = `
local value = redis.call('GET', KEYS[1])
redis.call('DEL', KEYS[1])
return value
`

const incrementScript = `
local exists = redis.call('EXISTS', KEYS[1])
local value = redis.call('INCR', KEYS[1])
if exists == 0 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return value
`

function parseValue(value) {
  if (typeof value !== 'string') return value
  if (value === 'undefined') return undefined
  if (value === 'NaN') return Number.NaN
  if (value === 'Infinity') return Number.POSITIVE_INFINITY
  if (value === '-Infinity') return Number.NEGATIVE_INFINITY

  try {
    return JSON.parse(value, (key, child) => {
      if (key === '__proto__' || (key === 'constructor' && child && typeof child === 'object' && 'prototype' in child)) return undefined
      return child
    })
  } catch {
    return value
  }
}

function normalizeTTL(ttl) {
  if (!Number.isFinite(ttl) || ttl <= 0) {
    throw new TypeError('Atomic KV increment requires a positive TTL in seconds.')
  }
  return Math.ceil(ttl)
}

function redisKey(options, key) {
  return joinKeys(options.base, key)
}

function redisOperations(driver, options, upstash) {
  const client = () => driver.getInstance()

  return {
    async getAndDelete(key) {
      const instance = await client()
      const resolvedKey = redisKey(options, key)
      const value = upstash
        ? await instance.getdel(resolvedKey)
        : await instance.eval(getAndDeleteScript, 1, resolvedKey)
      return parseValue(value)
    },
    async increment(key, ttl) {
      const seconds = normalizeTTL(ttl)
      const instance = await client()
      const value = upstash
        ? await instance.eval(incrementScript, [redisKey(options, key)], [String(seconds)])
        : await instance.eval(incrementScript, 1, redisKey(options, key), String(seconds))
      return Number(value)
    }
  }
}

export function addAtomicKVOperations(storage, driver, driverName, options = {}) {
  const operations = driverName === 'redis'
    ? redisOperations(driver, options, false)
    : driverName === 'upstash'
      ? redisOperations(driver, options, true)
      : undefined

  return operations ? Object.assign(storage, operations) : storage
}
