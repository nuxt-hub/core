import { afterEach, describe, expect, it, vi } from 'vitest'
import { createBlobStorage } from '../src/blob/lib/storage'
import { createDriver } from '../src/blob/lib/drivers/s3'

const blob = createBlobStorage(createDriver({
  accessKeyId: 'key',
  secretAccessKey: 'secret',
  bucket: 'my-bucket',
  region: 'auto',
  endpoint: 'https://s3.example.com'
}))

function mockFetch() {
  const requests: Request[] = []
  vi.stubGlobal('fetch', async (request: Request) => {
    requests.push(request)
    return new Response(null, { status: 404 })
  })
  return requests
}

describe('S3 blob driver', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps requests inside the bucket object path', async () => {
    const requests = mockFetch()
    await blob.get('a/b c+d%3Fpolicy%23e.png')
    await blob.del('%3Fpolicy')
    expect(requests.map(r => `${r.method} ${r.url}`)).toEqual([
      'GET https://s3.example.com/my-bucket/a/b%20c%2Bd%3Fpolicy%23e.png',
      'DELETE https://s3.example.com/my-bucket/%3Fpolicy'
    ])
  })

  it('rejects pathnames escaping the bucket', async () => {
    const requests = mockFetch()
    for (const pathname of ['../other-bucket/secret', '%2e%2e%2Fother-bucket%2Fsecret', '.%09./other-bucket/secret', '', '%2F']) {
      await expect(blob.get(pathname), pathname).rejects.toThrow('Invalid blob pathname')
    }
    expect(requests).toEqual([])
  })
})
