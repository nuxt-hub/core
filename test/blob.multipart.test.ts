import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useMultipartUpload } from '../src/blob/runtime/app/composables/useMultipartUpload'

const mocks = vi.hoisted(() => ({
  blobProvider: 'vercel-blob',
  fetch: vi.fn(),
  vercelUpload: vi.fn()
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    public: {
      hub: {
        blobProvider: mocks.blobProvider
      }
    }
  })
}))

vi.mock('ofetch', () => ({
  ofetch: {
    create: () => mocks.fetch
  }
}))

vi.mock('@vercel/blob/client', () => ({
  upload: mocks.vercelUpload
}))

describe('useMultipartUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.blobProvider = 'vercel-blob'
    mocks.vercelUpload.mockResolvedValue({
      pathname: 'test.txt',
      contentType: 'text/plain',
      size: 4,
      url: 'https://example.com/test.txt'
    })
  })

  it('does not create a generic multipart upload for Vercel Blob', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const upload = useMultipartUpload('/api/blob/multipart')

    await upload(file).completed

    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.vercelUpload).toHaveBeenCalledOnce()
  })

  it('uses prefix for Vercel Blob pathname and handleUploadUrl', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const upload = useMultipartUpload('/api/blob/multipart', {
      prefix: 'uploads/documents'
    })

    await upload(file).completed

    expect(mocks.vercelUpload).toHaveBeenCalledWith(
      'uploads/documents/test.txt',
      file,
      expect.objectContaining({
        access: 'public',
        multipart: true,
        handleUploadUrl: '/api/blob/multipart/multipart/uploads/documents/test.txt'
      })
    )
  })

  it('aborts Vercel Blob upload using AbortSignal', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const upload = useMultipartUpload('/api/blob/multipart')
    const uploader = upload(file)

    await vi.waitFor(() => {
      expect(mocks.vercelUpload).toHaveBeenCalledOnce()
    })

    const options = mocks.vercelUpload.mock.calls[0]![2]

    expect(options.abortSignal.aborted).toBe(false)

    await uploader.abort()

    expect(options.abortSignal.aborted).toBe(true)
  })

  it('updates progress from Vercel Blob upload progress', async () => {
    mocks.vercelUpload.mockImplementation(async (_pathname, _file, options) => {
      options.onUploadProgress({ percentage: 42 })

      return {
        pathname: 'test.txt',
        contentType: 'text/plain',
        size: 4,
        url: 'https://example.com/test.txt'
      }
    })

    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const upload = useMultipartUpload('/api/blob/multipart')
    const uploader = upload(file)

    await uploader.completed

    expect(uploader.progress.value).toBe(42)
  })

  it('keeps using the generic multipart flow for other providers', async () => {
    mocks.blobProvider = 'fs'

    mocks.fetch.mockImplementation(async (path: string) => {
      if (path.startsWith('/create/')) {
        return {
          pathname: 'test.txt',
          uploadId: 'upload-id'
        }
      }

      if (path.startsWith('/upload/')) {
        return {
          partNumber: 1,
          etag: 'etag'
        }
      }

      if (path.startsWith('/complete/')) {
        return {
          pathname: 'test.txt',
          contentType: 'text/plain',
          size: 4
        }
      }
    })

    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const upload = useMultipartUpload('/api/blob/multipart', {
      partSize: 10
    })

    await upload(file).completed

    expect(mocks.fetch).toHaveBeenCalledWith(
      '/create/test.txt',
      expect.objectContaining({
        method: 'POST'
      })
    )
    expect(mocks.vercelUpload).not.toHaveBeenCalled()
  })
})
