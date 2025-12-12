import { AwsClient } from 'aws4fetch'
import type { BlobDriver, BlobPutBody } from './types'
import type { BlobListOptions, BlobListResult, BlobMultipartOptions, BlobMultipartUpload, BlobObject, BlobPutOptions, BlobUploadedPart } from '../../types'
import { getContentType } from '../utils'
import { camelCase, snakeCase } from 'scule'

export interface S3DriverOptions {
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  region?: string
  endpoint?: string
}

const xmlTagContent = (xml: string, tag: string): string | undefined => {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))
  return match ? decodeURIComponent(match[1]!) : undefined
}

const xmlTagContentRequired = (xml: string, tag: string): string => {
  const content = xmlTagContent(xml, tag)
  if (!content) throw new Error(`Missing <${tag}> in XML.`)
  return content
}

const xmlTag = (tag: string, content: string | number): string => {
  return `<${tag}>${content}</${tag}>`
}

// Parse S3 ListObjectsV2 response
const parseListResponse = (xml: string): { objects: S3Object[], isTruncated: boolean, nextToken?: string, prefixes: string[] } => {
  const objects: S3Object[] = []
  const prefixes: string[] = []

  // Parse objects
  const contentsMatches = xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)
  for (const match of contentsMatches) {
    const content = match[1]!
    objects.push({
      key: xmlTagContentRequired(content, 'Key'),
      size: Number.parseInt(xmlTagContent(content, 'Size') || '0', 10),
      lastModified: new Date(xmlTagContent(content, 'LastModified') || ''),
      etag: xmlTagContent(content, 'ETag') || ''
    })
  }

  // Parse common prefixes (folders)
  const prefixMatches = xml.matchAll(/<CommonPrefixes>[\s\S]*?<Prefix>([\s\S]*?)<\/Prefix>[\s\S]*?<\/CommonPrefixes>/g)
  for (const match of prefixMatches) {
    prefixes.push(match[1]!)
  }

  const isTruncated = xmlTagContent(xml, 'IsTruncated') === 'true'
  const nextToken = xmlTagContent(xml, 'NextContinuationToken')

  return { objects, isTruncated, nextToken, prefixes }
}

interface S3Object {
  key: string
  size: number
  lastModified: Date
  etag: string
}

function mapS3ObjectToBlob(object: S3Object): BlobObject {
  return {
    pathname: object.key,
    contentType: getContentType(object.key),
    size: object.size,
    httpEtag: object.etag,
    uploadedAt: object.lastModified,
    httpMetadata: {},
    customMetadata: {}
  }
}

export function createDriver(options: S3DriverOptions): BlobDriver<S3DriverOptions> {
  // Use path-style for custom endpoints (S3-compatible services like MinIO, R2, etc.)
  // Use virtual-hosted style for AWS S3
  const baseEndpoint = options.endpoint ?? `https://${options.bucket}.s3.${options.region}.amazonaws.com`
  const bucketUrl = options.endpoint && options.bucket ? `${baseEndpoint}/${options.bucket}` : baseEndpoint

  const aws = new AwsClient({
    accessKeyId: options.accessKeyId,
    secretAccessKey: options.secretAccessKey,
    region: options.region,
    service: 's3'
  })

  return {
    name: 's3',
    options,

    async list(listOptions?: BlobListOptions): Promise<BlobListResult> {
      const params = new URLSearchParams({
        'list-type': '2',
        'max-keys': String(listOptions?.limit ?? 1000)
      })

      if (listOptions?.prefix) {
        params.set('prefix', listOptions.prefix)
      }
      if (listOptions?.cursor) {
        params.set('continuation-token', listOptions.cursor)
      }
      if (listOptions?.folded) {
        params.set('delimiter', '/')
      }

      const res = await aws.fetch(`${bucketUrl}?${params}`)
      if (!res.ok) {
        throw new Error(`S3 list failed: ${res.status} ${res.statusText}`)
      }

      const xml = await res.text()
      const { objects, isTruncated, nextToken, prefixes } = parseListResponse(xml)

      return {
        blobs: objects.map(mapS3ObjectToBlob),
        hasMore: isTruncated,
        cursor: nextToken,
        folders: listOptions?.folded ? prefixes : undefined
      }
    },

    async get(pathname: string): Promise<Blob | null> {
      const res = await aws.fetch(`${bucketUrl}/${encodeURI(decodeURIComponent(pathname))}`)

      if (res.status === 404) {
        return null
      }
      if (!res.ok) {
        throw new Error(`S3 get failed: ${res.status} ${res.statusText}`)
      }

      const arrayBuffer = await res.arrayBuffer()
      const contentType = res.headers.get('content-type') || getContentType(pathname)
      return new Blob([arrayBuffer], { type: contentType })
    },

    async getArrayBuffer(pathname: string): Promise<ArrayBuffer | null> {
      const res = await aws.fetch(`${bucketUrl}/${encodeURI(decodeURIComponent(pathname))}`)

      if (res.status === 404) {
        return null
      }
      if (!res.ok) {
        throw new Error(`S3 get failed: ${res.status} ${res.statusText}`)
      }

      return res.arrayBuffer()
    },

    async put(pathname: string, body: BlobPutBody, putOptions?: BlobPutOptions): Promise<BlobObject> {
      const contentType = putOptions?.contentType || (body instanceof File || body instanceof Blob ? body.type : undefined) || getContentType(pathname)

      // Convert body to ArrayBuffer for proper S3 signing (aws4fetch needs to hash the body)
      let processedBody: ArrayBuffer | string
      if (body instanceof File || body instanceof Blob) {
        processedBody = await body.arrayBuffer()
      } else if (body instanceof ReadableStream) {
        // ReadableStream must be converted to ArrayBuffer for S3 signing
        const response = new Response(body)
        processedBody = await response.arrayBuffer()
      } else if (ArrayBuffer.isView(body)) {
        processedBody = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer
      } else {
        processedBody = body as ArrayBuffer | string
      }

      // Calculate content length
      const contentLength = typeof processedBody === 'string'
        ? new TextEncoder().encode(processedBody).length
        : processedBody.byteLength

      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Content-Length': String(contentLength)
      }

      // Add custom metadata as x-amz-meta-* headers
      if (putOptions?.customMetadata) {
        for (const [key, value] of Object.entries(putOptions.customMetadata)) {
          headers[`x-amz-meta-${snakeCase(key)}`] = encodeURIComponent(value)
        }
      }

      // Add support for public/private access
      if (putOptions?.access === 'public') {
        headers['x-amz-acl'] = 'public-read'
      }

      const res = await aws.fetch(`${bucketUrl}/${encodeURI(decodeURIComponent(pathname))}`, {
        method: 'PUT',
        headers,
        body: processedBody
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`S3 put failed: ${res.status} ${res.statusText} ${text}`)
      }

      const etag = res.headers.get('ETag') || ''

      return {
        pathname,
        contentType,
        size: contentLength,
        httpEtag: etag,
        uploadedAt: new Date(),
        httpMetadata: {},
        customMetadata: putOptions?.customMetadata || {}
      }
    },

    async head(pathname: string): Promise<BlobObject | null> {
      const res = await aws.fetch(`${bucketUrl}/${encodeURI(decodeURIComponent(pathname))}`, {
        method: 'HEAD'
      })

      if (res.status === 404) {
        return null
      }
      if (!res.ok) {
        throw new Error(`S3 head failed: ${res.status} ${res.statusText}`)
      }

      const contentType = res.headers.get('content-type') || getContentType(pathname)
      const contentLength = Number.parseInt(res.headers.get('content-length') || '0', 10)
      const etag = res.headers.get('etag') || ''
      const lastModified = res.headers.get('last-modified')

      // Extract custom metadata from x-amz-meta-* headers
      const customMetadata: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        if (key.toLowerCase().startsWith('x-amz-meta-')) {
          const metaKey = camelCase(key.substring('x-amz-meta-'.length))
          customMetadata[metaKey] = decodeURIComponent(value)
        }
      })

      return {
        pathname: decodeURIComponent(pathname),
        contentType,
        size: contentLength,
        httpEtag: etag,
        uploadedAt: lastModified ? new Date(lastModified) : new Date(),
        httpMetadata: {},
        customMetadata
      }
    },

    async hasItem(pathname: string): Promise<boolean> {
      const res = await aws.fetch(`${bucketUrl}/${encodeURI(decodeURIComponent(pathname))}`, {
        method: 'HEAD'
      })
      return res.ok
    },

    async delete(pathnames: string | string[]): Promise<void> {
      const paths = Array.isArray(pathnames) ? pathnames : [pathnames]

      if (paths.length === 1) {
        // Single delete
        const res = await aws.fetch(`${bucketUrl}/${encodeURI(decodeURIComponent(paths[0]!))}`, {
          method: 'DELETE'
        })
        if (!res.ok && res.status !== 404) {
          throw new Error(`S3 delete failed: ${res.status} ${res.statusText}`)
        }
      } else {
        // Batch delete
        const deleteXml = `<?xml version="1.0" encoding="UTF-8"?>
<Delete>
  ${paths.map(p => `<Object><Key>${decodeURIComponent(p)}</Key></Object>`).join('')}
</Delete>`

        const res = await aws.fetch(`${bucketUrl}?delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/xml' },
          body: deleteXml
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`S3 batch delete failed: ${res.status} ${res.statusText} ${text}`)
        }
      }
    },

    async createMultipartUpload(pathname: string, mpuOptions?: BlobMultipartOptions): Promise<BlobMultipartUpload> {
      const headers = buildCreateHeaders(mpuOptions)

      const res = await aws.fetch(`${bucketUrl}/${encodeURI(decodeURIComponent(pathname))}?uploads`, {
        method: 'POST',
        headers
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`S3 initiate multipart upload failed: ${res.status} ${res.statusText} ${text}`)
      }

      const xml = await res.text()
      const uploadId = xmlTagContentRequired(xml, 'UploadId')

      return createMultipartUploadObject(aws, bucketUrl, pathname, uploadId, mpuOptions)
    },

    async resumeMultipartUpload(pathname: string, uploadId: string): Promise<BlobMultipartUpload> {
      return createMultipartUploadObject(aws, bucketUrl, pathname, uploadId)
    }
  }
}

const buildCreateHeaders = (opts?: BlobMultipartOptions): Record<string, string> => {
  const headers: Record<string, string> = {}
  if (opts?.contentType) headers['Content-Type'] = opts.contentType
  if (opts?.customMetadata) {
    for (const [k, v] of Object.entries(opts.customMetadata)) {
      headers[`x-amz-meta-${snakeCase(k)}`] = encodeURIComponent(v)
    }
  }
  return headers
}

function createMultipartUploadObject(
  aws: AwsClient,
  bucketUrl: string,
  pathname: string,
  uploadId: string,
  mpuOptions?: BlobMultipartOptions
): BlobMultipartUpload {
  const objectUrl = `${bucketUrl}/${encodeURI(decodeURIComponent(pathname))}`

  return {
    pathname,
    uploadId,

    async uploadPart(partNumber: number, value): Promise<BlobUploadedPart> {
      if (!Number.isInteger(partNumber) || partNumber < 1) {
        throw new Error('partNumber must be a positive integer starting at 1')
      }

      const res = await aws.fetch(
        `${objectUrl}?partNumber=${partNumber}&uploadId=${encodeURIComponent(uploadId)}`,
        {
          method: 'PUT',
          body: value as BodyInit
        }
      )

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`S3 upload part ${partNumber} failed: ${res.status} ${res.statusText} ${text}`)
      }

      const etag = res.headers.get('ETag')
      if (!etag) {
        throw new Error('Missing ETag on UploadPart response')
      }

      return { partNumber, etag }
    },

    async abort(): Promise<void> {
      const res = await aws.fetch(
        `${objectUrl}?uploadId=${encodeURIComponent(uploadId)}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`S3 abort multipart upload failed: ${res.status} ${res.statusText} ${text}`)
      }
    },

    async complete(uploadedParts: BlobUploadedPart[]): Promise<BlobObject> {
      if (!Array.isArray(uploadedParts) || uploadedParts.length === 0) {
        throw new Error('uploadedParts must be a non-empty array')
      }

      const sortedParts = [...uploadedParts].sort((a, b) => a.partNumber - b.partNumber)

      const res = await aws.fetch(
        `${objectUrl}?uploadId=${encodeURIComponent(uploadId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/xml' },
          body: xmlTag(
            'CompleteMultipartUpload',
            sortedParts.map(p =>
              xmlTag('Part', xmlTag('PartNumber', p.partNumber) + xmlTag('ETag', p.etag))
            ).join('')
          )
        }
      )

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`S3 complete multipart upload failed: ${res.status} ${res.statusText} ${text}`)
      }

      const xml = await res.text()
      const etag = xmlTagContent(xml, 'ETag')

      return {
        pathname,
        contentType: mpuOptions?.contentType || getContentType(pathname),
        url: xmlTagContent(xml, 'Location'),
        httpEtag: etag,
        uploadedAt: new Date(),
        httpMetadata: {},
        customMetadata: mpuOptions?.customMetadata || {}
      }
    }
  }
}
