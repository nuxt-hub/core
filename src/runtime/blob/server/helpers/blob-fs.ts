import type { BlobMultipartUpload, BlobObject, BlobUploadedPart } from '~/src/types/blob'
import { randomUUID } from 'uncrypto'
import { join } from 'pathe'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import type { Driver } from 'unstorage'

export async function createMultipartUpload(driver: Driver, pathname: string, _metadata?: Record<string, unknown>) {
  const uploadId = randomUUID()
  return createOrResumeMultipartUpload(driver, pathname, uploadId, _metadata)
}

export async function resumeMultipartUpload(driver: Driver, pathname: string, uploadId: string) {
  return createOrResumeMultipartUpload(driver, pathname, uploadId)
}

async function createOrResumeMultipartUpload(driver: Driver, pathname: string, uploadId: string, _metadata?: Record<string, unknown>): Promise<BlobMultipartUpload> {
  if (!_metadata) {
    _metadata = (driver.getMeta ? await driver.getMeta!(pathname, {}) : await driver.getItem(pathname + '$', {})) as Record<string, unknown>

    if (!_metadata) {
      throw new Error('Metadata not found')
    }
  }

  const currentMetadata = {
    pathname,
    uploadId,
    ..._metadata,
    contentType: _metadata?.contentType as string || 'application/octet-stream',
    customMetadata: _metadata?.customMetadata as Record<string, string> || {},
    parts: new Map(_metadata?.parts as Array<any> || [])
  }

  return {
    pathname,
    uploadId,
    async uploadPart(partNumber: number, value): Promise<BlobUploadedPart> {
      // Convert value to Uint8Array for binary storage - preserve binary data integrity
      let processedBody: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView = value as any
      if (value instanceof Blob) {
        const arrayBuffer = await value.arrayBuffer()
        processedBody = new Uint8Array(arrayBuffer)
      }

      await driver.setItemRaw!(partKey(uploadId, partNumber), processedBody, {})

      const uploadedPart: BlobUploadedPart = {
        partNumber,
        etag: `"${randomUUID()}"`
      }

      // Update metadata
      currentMetadata.parts.set(partNumber, uploadedPart)
      await driver.setItem!(pathname + '$', JSON.stringify({
        ...currentMetadata,
        parts: Array.from(currentMetadata.parts.entries())
      }), {})

      return uploadedPart
    },
    async complete(uploadedParts: BlobUploadedPart[]): Promise<BlobObject> {
      // Validate parts
      if (uploadedParts.length === 0) {
        throw new Error('No parts provided for completion')
      }

      // Sort parts by part number
      uploadedParts.sort((a, b) => a.partNumber - b.partNumber)

      // Check for missing parts
      const expectedPartNumbers = Array.from({ length: uploadedParts.length }, (_, i) => i + 1)
      const actualPartNumbers = uploadedParts.map(p => p.partNumber)

      for (const expectedPart of expectedPartNumbers) {
        if (!actualPartNumbers.includes(expectedPart)) {
          throw new Error(`Missing part ${expectedPart}`)
        }
      }

      const size = await completeUpload(driver, pathname, uploadId, uploadedParts)
      await cleanUploadTmpFiles(driver, uploadId, pathname)

      return {
        pathname: currentMetadata.pathname,
        contentType: currentMetadata.contentType,
        size,
        httpEtag: `"${randomUUID()}"`,
        uploadedAt: new Date(),
        httpMetadata: {
          contentType: currentMetadata.contentType
        },
        customMetadata: currentMetadata.customMetadata || {}
      }
    },
    async abort(): Promise<void> {
      await cleanUploadTmpFiles(driver, uploadId, pathname)
    }
  }
}

function partKey(uploadId: string, partNumber: number) {
  return `${uploadId}/${partNumber.toString().padStart(10, '0')}$`
}

async function cleanUploadTmpFiles(driver: Driver, uploadId: string, pathname: string) {
  const root = driver.options.base
  const fullPath = join(root, uploadId)
  await fsp.rm(fullPath, { recursive: true, force: true })
  await driver.removeItem!(pathname + '$', {})
}

async function completeUpload(driver: Driver, pathname: string, uploadId: string, uploadedParts: BlobUploadedPart[]): Promise<number> {
  const root = driver.options.base
  const fullPath = join(root, pathname)
  const orderedUploadedParts = uploadedParts.sort((a, b) => a.partNumber - b.partNumber)

  const writeStream = fs.createWriteStream(fullPath)
  for (const file of orderedUploadedParts) {
    await new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(join(root, partKey(uploadId, file.partNumber)))
      readStream.pipe(writeStream, { end: false })
      readStream.on('error', reject)
      readStream.on('end', resolve as () => void)
    })
  }

  return new Promise((resolve, reject) => {
    writeStream.end()
    writeStream.on('finish', () => {
      resolve(fs.statSync(fullPath).size)
    })
    writeStream.on('error', (error) => {
      reject(error)
    })
  })
}
