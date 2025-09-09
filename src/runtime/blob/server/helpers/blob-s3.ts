import { AwsClient } from 'aws4fetch'
import type { BlobMultipartUpload, BlobMultipartOptions } from '@nuxthub/core'
import type { S3DriverOptions } from 'unstorage/drivers/s3'

export async function createMultipartUpload(pathname: string, driverOptions: S3DriverOptions, options?: BlobMultipartOptions): Promise<BlobMultipartUpload> {
  const aws = new AwsClient({
    accessKeyId: driverOptions.accessKeyId!,
    secretAccessKey: driverOptions.secretAccessKey!,
    region: driverOptions.region!,
    service: 's3'
  })

  const res = await aws.fetch(`${baseUrl(driverOptions, pathname)}?uploads`, { method: 'POST', headers: buildCreateHeaders(options) }).catch((e) => {
    console.log('error', e)
    throw e
  })
  if (!res.ok) {
    console.log('error', res)
    throw new Error(`Initiate failed: ${res.status} ${res.statusText}`)
  }
  const xmlText = await res.text()
  const uploadId = xmlTagContent(xmlText, 'UploadId')!

  return resumeMultipartUpload(pathname, uploadId, driverOptions, options)
}

export async function resumeMultipartUpload(pathname: string, uploadId: string, driverOptions: S3DriverOptions, options?: BlobMultipartOptions): Promise<BlobMultipartUpload> {
  const aws = new AwsClient({
    accessKeyId: driverOptions.accessKeyId!,
    secretAccessKey: driverOptions.secretAccessKey!,
    region: driverOptions.region!
  })
  const objectUrl = baseUrl(driverOptions, pathname)

  return {
    pathname,
    uploadId,

    async uploadPart(partNumber, value) {
      if (!Number.isInteger(partNumber) || partNumber < 1) {
        throw new Error('partNumber must be a positive integer starting at 1')
      }

      const res = await aws.fetch(`${objectUrl}?partNumber=${partNumber}&uploadId=${encodeURIComponent(uploadId)}`, {
        method: 'PUT',
        body: value as unknown as BodyInit
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`UploadPart ${partNumber} failed: ${res.status} ${res.statusText} ${text}`)
      }

      const ETag = res.headers.get('ETag')
      if (!ETag) {
        throw new Error('Missing ETag on UploadPart response; check bucket CORS ExposeHeader.')
      }
      return { partNumber, etag: ETag }
    },

    async abort() {
      const res = await aws.fetch(`${objectUrl}?uploadId=${encodeURIComponent(uploadId)}`, { method: 'DELETE' })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Abort failed: ${res.status} ${res.statusText} ${text}`)
      }
    },

    async complete(uploadedParts) {
      if (!Array.isArray(uploadedParts) || uploadedParts.length === 0) {
        throw new Error('uploadedParts must be a non-empty array')
      }

      const parts = [...uploadedParts].sort((a, b) => a.partNumber - b.partNumber)

      const res = await aws.fetch(`${objectUrl}?uploadId=${encodeURIComponent(uploadId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xmlTag(
          'CompleteMultipartUpload',
          parts.map(
            p => xmlTag(
              'Part',
              xmlTag('PartNumber', p.partNumber) + xmlTag('ETag', p.etag)
            )
          ).join('')
        )
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Complete failed: ${res.status} ${res.statusText} ${text}`)
      }

      const xmlText = await res.text()
      console.log('xmlText', xmlText)
      return {
        pathname,
        contentType: 'application/octet-stream',
        url: xmlTagContent(xmlText, 'Location'),
        size: 0,
        httpEtag: xmlTagContent(xmlText, 'ETag'),
        uploadedAt: new Date(),
        httpMetadata: {},
        customMetadata: {}
      }
    }
  }
}

const baseUrl = (driverOptions: S3DriverOptions, key?: string) => {
  const host = driverOptions.endpoint
    ? driverOptions.endpoint
    : (
        driverOptions.region
          ? `https://${driverOptions.bucket}.s3.${driverOptions.region}.amazonaws.com`
          : `https://${driverOptions.bucket}.s3.amazonaws.com`
      )
  return key ? `${host}/${encodeURI(driverOptions.bucket)}/${encodeURI(key)}` : host
}

const buildCreateHeaders = (opts?: BlobMultipartOptions) => {
  const headers: Record<string, string> = {}
  if (opts?.contentType) headers['Content-Type'] = opts.contentType
  if (opts?.serverSideEncryption)
    headers['x-amz-server-side-encryption'] = opts.serverSideEncryption
  if (opts?.sseKmsKeyId)
    headers['x-amz-server-side-encryption-aws-kms-key-id'] = opts.sseKmsKeyId
  if (opts?.metadata) {
    for (const [k, v] of Object.entries(opts.metadata)) {
      headers[`x-amz-meta-${k.toLowerCase()}`] = String(v)
    }
  }

  return headers
}

const xmlTagContent = (xml: string, tag: string) => {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))
  if (!m) throw new Error(`Missing <${tag}> in XML.`)
  return decodeURIComponent(m[1]!)
}
const xmlTag = (tag: string, content: string | number) => {
  return `<${tag}>${content}</${tag}>`
}
