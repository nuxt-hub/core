import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('Image provider e2e', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/image', import.meta.url)),
    dev: false
  })

  it('generates Cloudflare Image Resizing URL for R2', async () => {
    const { url } = await $fetch<{ url: string }>('/images/_url', {
      query: { driver: 'cloudflare-r2', w: 300, q: 80 }
    })
    expect(url).toContain('/cdn-cgi/image/')
    expect(url).toContain('w=300')
    expect(url).toContain('q=80')
    expect(url).toContain('/images/photo.jpg')
  })

  it('generates Vercel Image Optimization URL for Vercel Blob', async () => {
    const { url } = await $fetch<{ url: string }>('/images/_url', {
      query: { driver: 'vercel-blob', w: 300, q: 80 }
    })
    expect(url.startsWith('/_vercel/image?')).toBe(true)
    expect(url).toContain('url=%2Fimages%2Fphoto.jpg')
    expect(url).toMatch(/[?&]w=\d+/)
    expect(url).toContain('q=80')
  })

  it('passes through URL for other drivers', async () => {
    const { url } = await $fetch<{ url: string }>('/images/_url', {
      query: { driver: 's3', w: 300, q: 80 }
    })
    expect(url).toBe('/images/photo.jpg')
  })
})
