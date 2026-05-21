import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'pathe'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { generateBlobContent, resolveBlobConfig } from '../src/blob/setup'
import type { BlobConfig, HubConfig } from '../src/types'

describe('blob config resolution', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  const createNuxt = (dev = false) => ({
    options: {
      dev
    }
  }) as any

  const createHub = (blob: HubConfig['blob']): HubConfig => ({
    blob,
    cache: false,
    db: false,
    kv: false,
    dir: '/tmp/test-hub',
    hosting: ''
  })

  async function importBlobModule(content: string) {
    const tempRoot = join(process.cwd(), '.tmp', 'blob-tests')
    await mkdir(tempRoot, { recursive: true })
    const tempDir = await mkdtemp(join(tempRoot, 'nuxthub-blob-test-'))
    const modulePath = join(tempDir, 'blob-runtime.mjs')
    await writeFile(modulePath, content)

    try {
      return await import(`${pathToFileURL(modulePath).href}?t=${Date.now()}`)
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  }

  it('accepts env-backed blob config types', () => {
    const s3Config: BlobConfig = { driver: 's3' }
    const vercelConfig: BlobConfig = { driver: 'vercel-blob' }

    expect(s3Config).toMatchObject({ driver: 's3' })
    expect(vercelConfig).toMatchObject({ driver: 'vercel-blob' })
  })

  it('resolves S3 for blob: true when S3 env vars are present', () => {
    process.env.S3_ACCESS_KEY_ID = 'key'
    process.env.S3_SECRET_ACCESS_KEY = 'secret'
    process.env.S3_BUCKET = 'bucket'
    process.env.S3_REGION = 'eu-central-1'

    const blobConfig = resolveBlobConfig(createHub(true), {
      aws4fetch: '1.0.20'
    })

    expect(blobConfig).toMatchObject({
      driver: 's3',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      bucket: 'bucket',
      region: 'eu-central-1'
    })
  })

  it('falls back to fs for blob: true when no blob env vars are present', () => {
    const blobConfig = resolveBlobConfig(createHub(true), {})

    expect(blobConfig).toMatchObject({
      driver: 'fs',
      dir: '/tmp/test-hub/blob'
    })
  })

  it('resolves explicit s3 config from runtime env vars', async () => {
    const hub = createHub({
      driver: 's3'
    })
    process.env.S3_ACCESS_KEY_ID = 'runtime-key'
    process.env.S3_SECRET_ACCESS_KEY = 'runtime-secret'
    process.env.S3_BUCKET = 'runtime-bucket'
    process.env.S3_REGION = 'eu-west-1'

    const blobConfig = resolveBlobConfig(hub, {
      aws4fetch: '1.0.20'
    })
    const blobContent = generateBlobContent(createNuxt(false), hub, { driver: 's3' }, blobConfig!)
    const { blob } = await importBlobModule(blobContent)

    expect(blob.driver.name).toBe('s3')
    expect(blob.driver.options).toMatchObject({
      accessKeyId: 'runtime-key',
      secretAccessKey: 'runtime-secret',
      bucket: 'runtime-bucket',
      region: 'eu-west-1'
    })
  })

  it('throws a clear runtime error for explicit s3 config without credentials', async () => {
    const hub = createHub({
      driver: 's3'
    })
    const blobConfig = resolveBlobConfig(hub, {
      aws4fetch: '1.0.20'
    })
    const blobContent = generateBlobContent(createNuxt(false), hub, { driver: 's3' }, blobConfig!)

    await expect(importBlobModule(blobContent)).rejects.toThrow(
      'S3 blob driver requires `accessKeyId`, `secretAccessKey`, and `bucket` or `endpoint` options'
    )
  })

  it('selects S3 at runtime for blob: true when env vars are injected after build', async () => {
    const hub = createHub(true)
    process.env.S3_ACCESS_KEY_ID = 'runtime-key'
    process.env.S3_SECRET_ACCESS_KEY = 'runtime-secret'
    process.env.S3_BUCKET = 'runtime-bucket'

    const blobConfig = resolveBlobConfig(hub, {})
    const blobContent = generateBlobContent(createNuxt(false), hub, true, blobConfig!)
    const { blob } = await importBlobModule(blobContent)

    expect(blob.driver.name).toBe('s3')
    expect(blob.driver.options).toMatchObject({
      accessKeyId: 'runtime-key',
      secretAccessKey: 'runtime-secret',
      bucket: 'runtime-bucket',
      region: 'auto'
    })
  })

  it('keeps fs for blob: true when no runtime env vars are injected', async () => {
    const hub = createHub(true)
    const blobConfig = resolveBlobConfig(hub, {})
    const blobContent = generateBlobContent(createNuxt(false), hub, true, blobConfig!)
    const { blob } = await importBlobModule(blobContent)

    expect(blob.driver.name).toBe('fs')
    expect(blob.driver.options).toMatchObject({
      dir: '/tmp/test-hub/blob'
    })
  })

  it('accepts explicit vercel-blob config without an inline token', () => {
    const blobConfig = resolveBlobConfig(createHub({
      driver: 'vercel-blob'
    }), {
      '@vercel/blob': '2.2.0'
    })

    expect(blobConfig).toMatchObject({
      driver: 'vercel-blob',
      access: 'public'
    })
  })
})
