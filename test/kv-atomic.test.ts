import { describe, expect, it, vi } from 'vitest'
import { addAtomicKVOperations } from '../src/kv/runtime/atomic.mjs'

describe('atomic KV operations', () => {
  it('uses Redis scripts for atomic deletion and fixed-window increments', async () => {
    const evalCommand = vi.fn()
      .mockResolvedValueOnce('{"value":true}')
      .mockResolvedValueOnce(2)
    const storage = addAtomicKVOperations({}, {
      getInstance: () => ({ eval: evalCommand })
    }, 'redis', { base: 'app' })

    await expect(storage.getAndDelete?.('token')).resolves.toEqual({ value: true })
    await expect(storage.increment?.('limit', 30)).resolves.toBe(2)
    expect(evalCommand).toHaveBeenNthCalledWith(1, expect.stringContaining('redis.call(\'GET\''), 1, 'app:token')
    expect(evalCommand).toHaveBeenNthCalledWith(2, expect.stringContaining('redis.call(\'INCR\''), 1, 'app:limit', '30')

    const incrementScript = String(evalCommand.mock.calls[1]?.[0])
    expect(incrementScript.indexOf('redis.call(\'EXISTS\'')).toBeLessThan(incrementScript.indexOf('redis.call(\'INCR\''))
    expect(incrementScript).toContain('if exists == 0')
    expect(incrementScript).not.toContain('if value == 1')
  })

  it('uses native Upstash deletion and its eval signature', async () => {
    const getdel = vi.fn(async () => ({ value: true }))
    const evalCommand = vi.fn(async () => 1)
    const storage = addAtomicKVOperations({}, {
      getInstance: () => ({ eval: evalCommand, getdel })
    }, 'upstash', { base: 'app:' })

    await expect(storage.getAndDelete?.('token')).resolves.toEqual({ value: true })
    await expect(storage.increment?.('limit', 10)).resolves.toBe(1)
    expect(getdel).toHaveBeenCalledWith('app:token')
    expect(evalCommand).toHaveBeenCalledWith(expect.any(String), ['app:limit'], ['10'])
  })

  it('rejects invalid counter TTLs before contacting Redis', async () => {
    const evalCommand = vi.fn()
    const storage = addAtomicKVOperations({}, {
      getInstance: () => ({ eval: evalCommand })
    }, 'redis')

    await expect(storage.increment?.('limit', 0)).rejects.toThrow('positive TTL')
    expect(evalCommand).not.toHaveBeenCalled()
  })

  it.each(['deno-kv', 'cloudflare-kv-binding', 's3', 'fs-lite'])('does not advertise atomic operations for %s', (driver) => {
    const storage = addAtomicKVOperations({}, {}, driver)

    expect(storage).not.toHaveProperty('getAndDelete')
    expect(storage).not.toHaveProperty('increment')
  })
})
