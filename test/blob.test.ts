import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import { version } from '../package.json'
import type { BlobListResult } from '../src/runtime/server/utils/blob'

const images = [
  {
    pathname: 'parse.jpg',
    contentType: 'image/jpeg',
    size: 5503753
  },
  {
    pathname: 'mountain.jpg',
    contentType: 'image/jpeg',
    size: 2094540
  }
]
describe('Blob', async () => {
  // clean up
  cleanUpBlobs()

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/blob', import.meta.url)),
    dev: true,
    configFile: 'nuxt.config.blob'
  })

  it('Check manifest (Blob is enabled)', async () => {
    const manifest = await $fetch('/api/_hub/manifest')
    expect(manifest).toMatchObject({
      version,
      storage: {
        database: false,
        kv: false,
        blob: true
      },
      features: {
        cache: false
      }
    })
  })

  it('Fetch Blobs List (Blobs are empty)', async () => {
    const result = await $fetch('/api/_hub/blob')
    expect(result).toMatchObject({
      blobs: [],
      hasMore: false
    })
  })

  describe('Upload', () => {
    it('Upload single file', async () => {
      const image = images[0]
      const file = await fs.readFile(fileURLToPath(new URL('./fixtures/blob/public/' + image.pathname, import.meta.url)))
      const form = new FormData()
      form.append('files', new File([file], image.pathname, { type: image.contentType }))
      const result = await $fetch('/api/_hub/blob', {
        method: 'POST',
        body: form
      })
      expect(result).toMatchObject([image])
    })

    it('Upload single file with prefix', async () => {
      const image = images[0]
      const file = await fs.readFile(fileURLToPath(new URL('./fixtures/blob/public/' + image.pathname, import.meta.url)))
      const form = new FormData()
      form.append('files', new File([file], image.pathname, { type: image.contentType }))
      const result = await $fetch('/api/_hub/blob', {
        method: 'POST',
        params: { prefix: 'foo/' },
        body: form
      })
      expect(result).toMatchObject([{ ...images[0], pathname: 'foo/' + images[0].pathname }])
    })

    it('Upload multiple files', async () => {
      const form = new FormData()
      for (const image of images) {
        form.append('files', new File([await fs.readFile(fileURLToPath(new URL('./fixtures/blob/public/' + image.pathname, import.meta.url)))], image.pathname, { type: image.contentType }))
      }
      const result = await $fetch('/api/_hub/blob', {
        method: 'POST',
        params: { prefix: 'multiple/' },
        body: form
      })
      expect(result).toMatchObject(images.map(image => ({ ...image, pathname: 'multiple/' + image.pathname })))
    })

    it('Upload multiple files while disabling multiple', async () => {
      const form = new FormData()
      for (const image of images) {
        form.append('files', new File([await fs.readFile(fileURLToPath(new URL('./fixtures/blob/public/' + image.pathname, import.meta.url)))], image.pathname, { type: image.contentType }))
      }
      const result = await $fetch('/api/_hub/blob', {
        method: 'POST',
        params: { prefix: 'multiple/', multiple: false },
        body: form
      }).catch((error) => {
        expect(error.response.status).toBe(400)
        expect(error.response._data).toMatchObject({ message: 'Multiple files are not allowed' })
        return null
      })

      expect(result).toBeNull()
    })

    // TODO: upload multipart
  })

  describe('List', () => {
    it('Fetch Blobs Flat List', async () => {
      const result = await $fetch<BlobListResult>('/api/_hub/blob')

      expect(result.hasMore).toBe(false)
      expect(result.folders).toBeUndefined()
      expect(result.cursor).toBeUndefined()
      for (const blob of result.blobs) {
        expect(blob.contentType).toMatch('image/jpeg')
        expect(blob.size).toBeGreaterThan(0)
      }
    })

    it('Fetch Blobs Folded List', async () => {
      const result = await $fetch<BlobListResult>('/api/_hub/blob', { params: { folded: true } })

      expect(result.hasMore).toBe(false)
      expect(result.cursor).toBeUndefined()
      expect(result.folders).not.toBeUndefined()
      for (const blob of result.blobs) {
        expect(blob.contentType).toMatch('image/jpeg')
        expect(blob.size).toBeGreaterThan(0)
      }

      for (const folder of result.folders!) {
        expect(folder).toMatch(/^\w+\/$/)
      }
    })

    it('Fetch Blobs List with pagination (limit 2)', async () => {
      const page1 = await $fetch<BlobListResult>('/api/_hub/blob', { params: { limit: 2 } })

      expect(page1.hasMore).toBe(true)
      expect(page1.cursor).not.toBeUndefined()
      expect(page1.folders).toBeUndefined()
      expect(page1.blobs.length).toBe(2)
      for (const blob of page1.blobs) {
        expect(blob.contentType).toMatch('image/jpeg')
        expect(blob.size).toBeGreaterThan(0)
      }

      const page2 = await $fetch<BlobListResult>('/api/_hub/blob', { params: { limit: 2, cursor: page1.cursor } })

      expect(page2.folders).toBeUndefined()
      expect(page2.blobs.length).toBe(2)
      for (const blob of page2.blobs) {
        expect(blob.contentType).toMatch('image/jpeg')
        expect(blob.size).toBeGreaterThan(0)
      }

      expect(
        page2.blobs.find(blob => page1.blobs[0].pathname === blob.pathname)
      ).toBeUndefined()
    })
  })
})

async function cleanUpBlobs() {
  await fs.rm(fileURLToPath(new URL('./fixtures/blob/.data/hub/r2', import.meta.url)), { force: true, recursive: true })
}
