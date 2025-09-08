import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('KV', async () => {
  let data: Record<string, any> = {
    'foo:object': { key: 'foo', value: 'bar' },
    // 'bar:string': 'some string',
    'baz:number': 123,
    'qux:boolean': true
  }

  await cleanUp()

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/kv', import.meta.url)),
    dev: true
  })

  it('Check KV is enabled', async () => {
    const manifest = await $fetch('/api/manifest')
    expect(manifest).toMatchObject({
      storage: {
        database: false,
        kv: true,
        blob: false
      },
      features: {
        cache: false
      }
    })
  })

  it('Fetch Keys List (empty)', async () => {
    const result = await $fetch('/api/kv/:')
    expect(result).toMatchObject([])
  })

  describe('Create Keys', () => {
    Object.keys(data).forEach((key: string) => {
      it(`create ${typeof data[key as keyof typeof data]} ${key}`, async () => {
        const result = await $fetch(`/api/kv/${key}`, {
          method: 'PUT',
          body: data[key as keyof typeof data]
        })
        expect(result).toEqual('OK')

        const result2 = await $fetch(`/api/kv/${key}`, { responseType: 'json' })
        expect(result2).toEqual(data[key as keyof typeof data])
      })
    })
  })

  describe('Update Keys', () => {
    data = {
      'foo:object': { key: 'foo', value: 'bar' },
      // 'bar:string': 'some string',
      'baz:number': 123,
      'qux:boolean': true
    }

    Object.keys(data).forEach((key: string) => {
      it(`update ${typeof data[key as keyof typeof data]} ${key}`, async () => {
        const result = await $fetch(`/api/kv/${key}`, {
          method: 'PUT',
          body: data[key as keyof typeof data]
        })
        expect(result).toEqual('OK')

        const result2 = await $fetch(`/api/kv/${key}`, { responseType: 'json' })
        expect(result2).toEqual(data[key as keyof typeof data])
      })
    })
  })

  describe('Fetch Keys', () => {
    Object.keys(data).forEach((key: string) => {
      it(`${typeof data[key as keyof typeof data]} ${key}`, async () => {
        const result = await $fetch(`/api/kv/${key}`, { responseType: 'json' })
        expect(result).toEqual(data[key as keyof typeof data])
      })
    })

    it('Fetch Keys List', async () => {
      const result = await $fetch('/api/kv/:')
      Object.keys(data).forEach(key => expect(result).includes(key))
    })
  })

  describe('Delete Keys', () => {
    Object.keys(data).forEach((key: string) => {
      it(`delete ${typeof data[key as keyof typeof data]} ${key}`, async () => {
        const result = await $fetch(`/api/kv/${key}`, { method: 'DELETE' })
        expect(result).toEqual('OK')

        const result2 = await $fetch(`/api/kv/${key}`)
          .catch((error) => {
            expect(error.response.status).toBe(404)
          })
        expect(result2).toBeUndefined()
      })
    })
  })
})

async function cleanUp() {
  await fs.rm(fileURLToPath(new URL('./fixtures/kv/.data/kv', import.meta.url)), { force: true, recursive: true })
}
