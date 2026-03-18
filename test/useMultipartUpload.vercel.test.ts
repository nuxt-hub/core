import { describe, expect, it, vi } from 'vitest'
import { loadVercelBlobClient } from '../src/blob/runtime/app/composables/useMultipartUpload'

vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    public: {
      hub: {
        blobProvider: 'fs'
      }
    }
  })
}))

describe('loadVercelBlobClient', () => {
  it('returns upload function when module is available', async () => {
    const upload = vi.fn()
    const importer = vi.fn().mockResolvedValue({ upload })

    const resolved = await loadVercelBlobClient(importer)

    expect(importer).toHaveBeenCalledWith('@vercel/blob/client')
    expect(resolved).toBe(upload)
  })

  it('throws actionable error when module is missing', async () => {
    const importer = vi.fn().mockRejectedValue(new Error('Cannot find module'))

    await expect(loadVercelBlobClient(importer))
      .rejects
      .toThrow('@vercel/blob is required to use `useMultipartUpload` with Vercel Blob. Install it with `pnpm add @vercel/blob`.')
  })

  it('throws actionable error when upload export is missing', async () => {
    const importer = vi.fn().mockResolvedValue({})

    await expect(loadVercelBlobClient(importer))
      .rejects
      .toThrow('@vercel/blob is required to use `useMultipartUpload` with Vercel Blob. Install it with `pnpm add @vercel/blob`.')
  })
})
