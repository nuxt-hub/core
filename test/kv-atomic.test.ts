import { describe, expect, it, vi } from 'vitest'
import { addAtomicKVOperations } from '../src/kv/runtime/atomic.mjs'

describe('atomic KV operations', () => {
  it('uses native Redis commands and preserves TTL on later increments', async () => {
    const getdel = vi.fn(async () => '{"value":true}')
    const evalCommand = vi.fn(async () => 2)
    const storage = addAtomicKVOperations({}, {
      getInstance: () => ({ eval: evalCommand, getdel })
    }, 'redis', { base: 'app' })

    await expect(storage.getAndDelete?.('token')).resolves.toEqual({ value: true })
    await expect(storage.increment?.('limit', 30)).resolves.toBe(2)
    expect(getdel).toHaveBeenCalledWith('app:token')
    expect(evalCommand).toHaveBeenCalledWith(expect.stringContaining('INCR'), 1, 'app:limit', '30')
    expect(evalCommand.mock.calls[0]?.[0]).toContain('if value == 1')
    expect(evalCommand.mock.calls[0]?.[0]).toContain('redis.call(\'EXPIRE\'')
  })

  it('uses the Upstash eval signature', async () => {
    const evalCommand = vi.fn(async () => 1)
    const storage = addAtomicKVOperations({}, {
      getInstance: () => ({ eval: evalCommand, getdel: vi.fn() })
    }, 'upstash', { base: 'app:' })

    await expect(storage.increment?.('limit', 10)).resolves.toBe(1)
    expect(evalCommand).toHaveBeenCalledWith(expect.any(String), ['app:limit'], ['10'])
  })

  it('uses a Deno KV transaction', async () => {
    const data = new Map<string, unknown>([['token', '{"value":true}']])
    const setOptions: Array<{ expireIn?: number } | undefined> = []
    const atomic = () => {
      let operation: () => void = () => {}
      const transaction = {
        check: () => transaction,
        delete: (key: string[]) => {
          operation = () => data.delete(key.join(':'))
          return transaction
        },
        set: (key: string[], value: unknown, options?: { expireIn?: number }) => {
          setOptions.push(options)
          operation = () => data.set(key.join(':'), value)
          return transaction
        },
        commit: async () => {
          operation()
          return { ok: true }
        }
      }
      return transaction
    }
    const driver = {
      getInstance: async () => ({
        atomic,
        get: async (key: string[]) => ({
          key,
          value: data.get(key.join(':')) ?? null,
          versionstamp: data.has(key.join(':')) ? '1' : null
        })
      })
    }
    const storage = addAtomicKVOperations({}, driver, 'deno-kv')

    await expect(storage.getAndDelete?.('token')).resolves.toEqual({ value: true })
    await expect(storage.getAndDelete?.('token')).resolves.toBeNull()
    await expect(storage.increment?.('limit', 10)).resolves.toBe(1)
    await expect(storage.increment?.('limit', 10)).resolves.toBe(2)
    expect(setOptions).toEqual([{ expireIn: 10_000 }, undefined])
  })

  it('does not advertise atomic operations for unsupported drivers', () => {
    const storage = addAtomicKVOperations({}, {}, 'cloudflare-kv-binding')

    expect(storage).not.toHaveProperty('getAndDelete')
    expect(storage).not.toHaveProperty('increment')
  })
})
