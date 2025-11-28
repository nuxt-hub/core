import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { describe, it, expect, vi } from 'vitest'
import { setup, $fetch, url } from '@nuxt/test-utils'
import type { BlobListResult } from '../src/types/blob'
import { useUpload } from '../src/runtime/blob/app/composables/useUpload'
import { useMultipartUpload } from '../src/runtime/blob/app/composables/useMultipartUpload'

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

// create mock for import { useRuntimeConfig } from '#imports'
vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    public: {
      hub: {
        blobProvider: 'fs-lite'
      }
    }
  })
}))

describe('Blob', async () => {
  await cleanUp()

  // Make $fetch available in composables
  global.$fetch = $fetch

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/blob', import.meta.url)),
    dev: true
  })

  it('Check Blob is enabled', async () => {
    const manifest = await $fetch('/api/manifest')
    expect(manifest).toMatchObject({
      storage: {
        db: false,
        kv: false,
        blob: true
      },
      features: {
        cache: false
      }
    })
  })

  it('Fetch Blobs List (Blobs are empty)', async () => {
    const result = await $fetch('/api/blob')
    expect(result).toMatchObject({
      blobs: [],
      hasMore: false
    })
  })

  describe('Composables', () => {
    describe('useUpload', () => {
      const upload = useUpload('/api/blob')
      it('should be defined', () => {
        expect(upload).toBeDefined()
      })
      it('should be a function', () => {
        expect(typeof upload).toBe('function')
      })
    })

    describe('useMultipartUpload', () => {
      const uploader = useMultipartUpload('/api/blob/multipart')
      it('should be defined', () => {
        expect(uploader).toBeDefined()
      })
      it('should be a function', () => {
        expect(typeof uploader).toBe('function')
      })
    })
  })

  describe('Put', () => {
    it('single file with custom metadata', async () => {
      const image = images[0]!
      const file = await fs.readFile(fileURLToPath(new URL('./fixtures/blob/public/' + image.pathname, import.meta.url)))
      const result = await $fetch(`/api/blob/${image.pathname}`, {
        method: 'PUT',
        body: file,
        headers: new Headers({
          'content-type': image.contentType,
          'content-length': image.size.toString()
        }),
        query: {
          customMetadata: {
            hello: 'world'
          }
        }
      })
      expect(result).toMatchObject({
        ...image,
        customMetadata: {
          hello: 'world'
        }
      })
    })
  })

  describe('Upload', () => {
    it('Upload single file', async () => {
      const image = images[0]!
      const file = await fs.readFile(fileURLToPath(new URL('./fixtures/blob/public/' + image.pathname, import.meta.url)))
      const form = new FormData()
      form.append('files', new File([file], image.pathname, { type: image.contentType }))
      const result = await $fetch('/api/blob', {
        method: 'POST',
        body: form
      })
      expect(result).toMatchObject([image])
    })

    it('Upload single file with prefix (handleUpload)', async () => {
      const image = images[0]!
      const file = await fs.readFile(fileURLToPath(new URL('./fixtures/blob/public/' + image.pathname, import.meta.url)))
      const form = new FormData()
      form.append('files', new File([file], image.pathname, { type: image.contentType }))
      const result = await $fetch('/api/blob', {
        method: 'POST',
        query: {
          put: {
            prefix: 'foo/'
          }
        },
        body: form
      })
      expect(result).toMatchObject([{ ...images[0]!, pathname: 'foo/' + images[0]!.pathname }])

      const file2 = await fs.readFile(fileURLToPath(new URL('./fixtures/blob/public/' + images[1]!.pathname, import.meta.url)))
      const form2 = new FormData()
      form2.append('files', new File([file2], images[1]!.pathname, { type: images[1]!.contentType }))
      await $fetch('/api/blob', {
        method: 'POST',
        query: {
          put: { prefix: 'foo/' }
        },
        body: form2
      })
    })

    it('Upload multiple files', async () => {
      const form = new FormData()
      for (const image of images) {
        form.append('files', new File([await fs.readFile(fileURLToPath(new URL('./fixtures/blob/public/' + image.pathname, import.meta.url)))], image.pathname, { type: image.contentType }))
      }
      const result = await $fetch('/api/blob', {
        method: 'POST',
        query: {
          put: { prefix: 'multiple/' }
        },
        body: form
      })
      expect(result).toMatchObject(images.map(image => ({ ...image, pathname: 'multiple/' + image.pathname })))
    })

    it('Upload multiple files with multiple: false', async () => {
      const form = new FormData()
      for (const image of images) {
        form.append('files', new File([await fs.readFile(fileURLToPath(new URL('./fixtures/blob/public/' + image.pathname, import.meta.url)))], image.pathname, { type: image.contentType }))
      }
      const result = await $fetch('/api/blob', {
        method: 'POST',
        query: {
          put: { prefix: 'multiple/' },
          multiple: false
        },
        body: form
      }).catch((error) => {
        expect(error.response.status).toBe(400)
        expect(error.response._data).toMatchObject({ message: 'Multiple files are not allowed' })
        return null
      })

      expect(result).toBeNull()
    })

    describe('with useUpload composable', () => {
      it('single file', async () => {
        const upload = useUpload('/api/blob')
        const files = [
          new File([await fs.readFile(fileURLToPath(new URL('./fixtures/blob/public/' + images[0]!.pathname, import.meta.url)))], images[0]!.pathname, { type: images[0]!.contentType })
        ]
        const result = await upload(files)
        expect(result).toMatchObject([{ ...images[0]!, pathname: images[0]!.pathname }])
      })

      it('multiple files', async () => {
        const upload = useUpload('/api/blob', {
          query: {
            put: {
              prefix: 'multiple2/'
            }
          }
        })
        const files = []
        for (const image of images) {
          files.push(new File([await fs.readFile(fileURLToPath(new URL('./fixtures/blob/public/' + image.pathname, import.meta.url)))], image.pathname, { type: image.contentType }))
        }
        const result = await upload(files)
        expect(result).toMatchObject(images.map(image => ({ ...image, pathname: 'multiple2/' + image.pathname })))
      })

      it('multiple files but accept only one', async () => {
        const upload = useUpload('/api/blob', { multiple: false })
        const files = []
        for (const image of images) {
          files.push(new File([await fs.readFile(fileURLToPath(new URL('./fixtures/blob/public/' + image.pathname, import.meta.url)))], image.pathname, { type: image.contentType }))
        }
        const result = await upload(files)
        expect(result).toMatchObject({ ...images[0]!, pathname: images[0]!.pathname })
      })
    })

    describe.skip('with useMultipartUpload composable', () => {
      let video: Blob
      it ('download big video', async () => {
        video = await fetch('https://www.pexels.com/download/video/6133212/').then(res => res.blob())
        expect(video).toBeInstanceOf(Blob)
      })

      it('upload single file', async () => {
        const upload = useMultipartUpload(url('/api/blob/multipart'))

        const files = [
          new File([video], 'sample-video.mp4', { type: 'video/mp4' })
        ]
        const uploader = upload(files[0]!)
        const result = await uploader.completed
        expect(result).toMatchObject({ contentType: 'video/mp4', size: video.size, pathname: 'sample-video.mp4' })
      })
    })
  })

  describe('List', () => {
    it('Fetch Blobs Flat List', async () => {
      const result = await $fetch<BlobListResult>('/api/blob')

      expect(result.hasMore).toBe(false)
      expect(result.folders).toBeUndefined()
      expect(result.cursor).toBeUndefined()
      for (const blob of result.blobs) {
        expect(['image/jpeg', 'video/mp4'].includes(blob.contentType!)).toBe(true)
        expect(blob.size).toBeGreaterThan(0)
      }
    })

    it('Fetch Blobs Folded List', async () => {
      const result = await $fetch<BlobListResult>('/api/blob', { query: { folded: true } })

      expect(result.hasMore).toBe(false)
      expect(result.cursor).toBeUndefined()
      expect(result.folders).not.toBeUndefined()
      for (const blob of result.blobs) {
        expect(['image/jpeg', 'video/mp4'].includes(blob.contentType!)).toBe(true)
        expect(blob.size).toBeGreaterThan(0)
      }

      for (const folder of result.folders!) {
        expect(folder).toMatch(/^\w+\/$/)
      }
    })

    it.skip('Fetch Blobs List with pagination (limit 2)', async () => {
      const page1 = await $fetch<BlobListResult>('/api/blob', { query: { limit: 2 } })

      expect(page1.hasMore).toBe(true)
      expect(page1.cursor).not.toBeUndefined()
      expect(page1.folders).toBeUndefined()
      expect(page1.blobs.length).toBe(2)
      for (const blob of page1.blobs) {
        expect(['image/jpeg', 'video/mp4'].includes(blob.contentType!)).toBe(true)
        expect(blob.size).toBeGreaterThan(0)
      }

      const page2 = await $fetch<BlobListResult>('/api/blob', { query: { limit: 2, cursor: page1.cursor } })

      expect(page2.folders).toBeUndefined()
      expect(page2.blobs.length).toBe(2)
      for (const blob of page2.blobs) {
        expect(['image/jpeg', 'video/mp4'].includes(blob.contentType!)).toBe(true)
        expect(blob.size).toBeGreaterThan(0)
      }

      expect(
        page2.blobs.find(blob => page1.blobs[0]!.pathname === blob.pathname)
      ).toBeUndefined()
    })
  })

  describe('Get', () => {
    it('Get single file', async () => {
      const image = images[0]!
      const result = await $fetch<Blob>(`/api/blob/${image.pathname}`)
      expect(result.size).toBe(image.size)
      expect(result.type).toBe(image.contentType)
    })
  })

  describe('Delete', () => {
    it('Delete single file', async () => {
      const blobsBeforeDelete = await $fetch<BlobListResult>('/api/blob')
      const image = images[0]!
      const result = await $fetch(`/api/blob/${image.pathname}`, { method: 'DELETE' })
      expect(result).toBe(undefined)
      const blobsAfterDelete = await $fetch<BlobListResult>('/api/blob')

      const expectedBlobs = blobsBeforeDelete.blobs.filter(blob => blob.pathname !== image.pathname)
      expect(blobsAfterDelete.blobs).toHaveLength(expectedBlobs.length)
      expect(blobsAfterDelete.blobs.length).not.toBe(blobsBeforeDelete.blobs.length)
      // Check that each expected blob exists in the result (order independent)
      for (const expectedBlob of expectedBlobs) {
        expect(blobsAfterDelete.blobs).toContainEqual(expect.objectContaining({
          pathname: expectedBlob.pathname,
          contentType: expectedBlob.contentType,
          size: expectedBlob.size
        }))
      }
    })

    it('Delete multiple file', async () => {
      const blobsBeforeDelete = await $fetch<BlobListResult>('/api/blob')
      const result = await $fetch('/api/blob/delete', {
        method: 'POST',
        body: {
          pathnames: images.map(image => `multiple/${image.pathname}`)
        }
      })
      expect(result).toBe(undefined)
      const blobsAfterDelete = await $fetch<BlobListResult>('/api/blob')

      const expectedBlobs = blobsBeforeDelete.blobs.filter(blob => !blob.pathname.startsWith('multiple/'))
      expect(blobsAfterDelete.blobs).toHaveLength(expectedBlobs.length)
      expect(blobsAfterDelete.blobs.length).not.toBe(blobsBeforeDelete.blobs.length)
      // Check that each expected blob exists in the result (order independent)
      for (const expectedBlob of expectedBlobs) {
        expect(blobsAfterDelete.blobs).toContainEqual(expect.objectContaining({
          pathname: expectedBlob.pathname,
          contentType: expectedBlob.contentType,
          size: expectedBlob.size
        }))
      }
    })

    it('Delete folder', async () => {
      const blobsBeforeDelete = await $fetch<BlobListResult>('/api/blob')

      const result = await $fetch('/api/blob/delete-folder', {
        method: 'POST',
        body: {
          prefix: 'foo/'
        }
      })
      expect(result).toBe(undefined)
      const blobsAfterDelete = await $fetch<BlobListResult>('/api/blob')

      const expectedBlobs = blobsBeforeDelete.blobs.filter(blob => !blob.pathname.startsWith('foo/'))
      expect(blobsAfterDelete.blobs).toHaveLength(expectedBlobs.length)
      expect(blobsAfterDelete.blobs.length).not.toBe(blobsBeforeDelete.blobs.length)
      // Check that each expected blob exists in the result (order independent)
      for (const expectedBlob of expectedBlobs) {
        expect(blobsAfterDelete.blobs).toContainEqual(expect.objectContaining({
          pathname: expectedBlob.pathname,
          contentType: expectedBlob.contentType,
          size: expectedBlob.size
        }))
      }
    })
  })
})

async function cleanUp() {
  await fs.rm(fileURLToPath(new URL('./fixtures/blob/.data/blob', import.meta.url)), { force: true, recursive: true })
}
