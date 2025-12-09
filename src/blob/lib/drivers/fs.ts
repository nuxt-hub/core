import { join, dirname } from 'pathe'
import { joinRelativeURL } from 'ufo'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { randomUUID } from 'uncrypto'
import type { BlobDriver, BlobPutBody } from './types'
import type { BlobListOptions, BlobListResult, BlobMultipartOptions, BlobMultipartUpload, BlobObject, BlobPutOptions, BlobUploadedPart } from '../../types'
import { getContentType } from '../utils'

export interface FSDriverOptions {
  dir: string
}

interface BlobMetadata {
  contentType?: string
  size?: number
  mtime?: Date
  customMetadata?: Record<string, string>
}

const META_EXTENSION = '.$meta.json'

export function createDriver(options: FSDriverOptions): BlobDriver<FSDriverOptions> {
  const dir = options.dir

  // Ensure directory exists
  const ensureBase = async () => {
    try {
      await fsp.mkdir(dir, { recursive: true })
    } catch { /* ignore if already exists */ }
  }

  const getFullPath = (pathname: string): string => {
    return join(dir, pathname)
  }

  const getMetaPath = (pathname: string): string => {
    return getFullPath(pathname) + META_EXTENSION
  }

  const readMeta = async (pathname: string): Promise<BlobMetadata> => {
    try {
      const metaPath = getMetaPath(pathname)
      const content = await fsp.readFile(metaPath, 'utf-8')
      return JSON.parse(content)
    } catch {
      return {}
    }
  }

  const writeMeta = async (pathname: string, meta: BlobMetadata): Promise<void> => {
    const metaPath = getMetaPath(pathname)
    await fsp.mkdir(dirname(metaPath), { recursive: true })
    await fsp.writeFile(metaPath, JSON.stringify(meta))
  }

  const deleteMeta = async (pathname: string): Promise<void> => {
    try {
      await fsp.unlink(getMetaPath(pathname))
    } catch { /* ignore if not exists */ }
  }

  const walkDir = async (dir: string, prefix: string = ''): Promise<string[]> => {
    const files: string[] = []
    try {
      const entries = await fsp.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        const relativePath = prefix ? joinRelativeURL(prefix, entry.name) : entry.name

        if (entry.isDirectory()) {
          const subFiles = await walkDir(fullPath, relativePath)
          files.push(...subFiles)
        } else if (!entry.name.endsWith(META_EXTENSION)) {
          files.push(relativePath)
        }
      }
    } catch { /* ignore directory read errors */ }
    return files
  }

  return {
    name: 'fs',
    options,

    async list(listOptions?: BlobListOptions): Promise<BlobListResult> {
      await ensureBase()

      const prefix = listOptions?.prefix || ''
      const searchDir = prefix ? join(dir, prefix) : dir

      let files: string[]
      const folders: string[] = []

      if (listOptions?.folded) {
        // For folded mode, only list immediate children
        try {
          const entries = await fsp.readdir(searchDir, { withFileTypes: true })
          files = []
          for (const entry of entries) {
            if (entry.name.endsWith(META_EXTENSION)) continue
            const relativePath = prefix ? joinRelativeURL(prefix, entry.name) : entry.name
            if (entry.isDirectory()) {
              folders.push(joinRelativeURL(relativePath, '/'))
            } else {
              files.push(relativePath)
            }
          }
        } catch {
          files = []
        }
      } else {
        // Walk all directories recursively
        files = await walkDir(searchDir, prefix)
      }

      // Get metadata for each file
      const blobs: BlobObject[] = await Promise.all(
        files.map(async (pathname) => {
          const fullPath = getFullPath(pathname)
          try {
            const stat = await fsp.stat(fullPath)
            const meta = await readMeta(pathname)

            return {
              pathname,
              contentType: meta?.contentType || getContentType(pathname),
              size: stat.size,
              httpEtag: `"${stat.mtimeMs.toString(16)}-${stat.size.toString(16)}"`,
              uploadedAt: stat.mtime,
              httpMetadata: {},
              customMetadata: meta?.customMetadata || {}
            }
          } catch {
            return {
              pathname,
              contentType: getContentType(pathname),
              size: 0,
              httpEtag: '',
              uploadedAt: new Date(),
              httpMetadata: {},
              customMetadata: {}
            }
          }
        })
      )

      return {
        blobs,
        hasMore: false,
        cursor: undefined,
        folders: listOptions?.folded ? folders : undefined
      }
    },

    async get(pathname: string): Promise<Blob | null> {
      const fullPath = getFullPath(decodeURIComponent(pathname))
      try {
        const buffer = await fsp.readFile(fullPath)
        const meta = await readMeta(pathname)
        return new Blob([buffer], {
          type: meta?.contentType || getContentType(pathname)
        })
      } catch {
        return null
      }
    },

    async getArrayBuffer(pathname: string): Promise<ArrayBuffer | null> {
      const fullPath = getFullPath(decodeURIComponent(pathname))
      try {
        const buffer = await fsp.readFile(fullPath)
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      } catch {
        return null
      }
    },

    async put(pathname: string, body: BlobPutBody, options?: BlobPutOptions): Promise<BlobObject> {
      await ensureBase()

      const fullPath = getFullPath(pathname)
      await fsp.mkdir(dirname(fullPath), { recursive: true })

      const contentType = options?.contentType || (body instanceof Blob ? body.type : undefined) || getContentType(pathname)

      // Convert body to Buffer
      let buffer: Buffer
      if (typeof body === 'string') {
        buffer = Buffer.from(body)
      } else if (body instanceof Blob) {
        buffer = Buffer.from(await body.arrayBuffer())
      } else if (body instanceof ArrayBuffer) {
        buffer = Buffer.from(body)
      } else if (ArrayBuffer.isView(body)) {
        buffer = Buffer.from(body.buffer, body.byteOffset, body.byteLength)
      } else if (body instanceof ReadableStream) {
        const chunks: Uint8Array[] = []
        const reader = body.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }
        buffer = Buffer.concat(chunks)
      } else {
        buffer = Buffer.from(body as any)
      }

      await fsp.writeFile(fullPath, buffer)

      // Write metadata
      const meta: BlobMetadata = {
        contentType,
        size: buffer.length,
        mtime: new Date(),
        customMetadata: options?.customMetadata
      }
      await writeMeta(pathname, meta)

      return {
        pathname,
        contentType,
        size: buffer.length,
        httpEtag: `"${Date.now().toString(16)}-${buffer.length.toString(16)}"`,
        uploadedAt: new Date(),
        httpMetadata: {},
        customMetadata: options?.customMetadata || {}
      }
    },

    async head(pathname: string): Promise<BlobObject | null> {
      const fullPath = getFullPath(decodeURIComponent(pathname))
      try {
        const stat = await fsp.stat(fullPath)
        const meta = await readMeta(pathname)

        return {
          pathname,
          contentType: meta?.contentType || getContentType(pathname),
          size: stat.size,
          httpEtag: `"${stat.mtimeMs.toString(16)}-${stat.size.toString(16)}"`,
          uploadedAt: stat.mtime,
          httpMetadata: {},
          customMetadata: meta?.customMetadata || {}
        }
      } catch {
        return null
      }
    },

    async hasItem(pathname: string): Promise<boolean> {
      const fullPath = getFullPath(decodeURIComponent(pathname))
      try {
        await fsp.access(fullPath)
        return true
      } catch {
        return false
      }
    },

    async delete(pathnames: string | string[]): Promise<void> {
      const paths = Array.isArray(pathnames) ? pathnames : [pathnames]
      await Promise.all(
        paths.map(async (p) => {
          const fullPath = getFullPath(decodeURIComponent(p))
          try {
            await fsp.unlink(fullPath)
            await deleteMeta(p)
          } catch { /* ignore if not exists */ }
        })
      )
    },

    async createMultipartUpload(pathname: string, options?: BlobMultipartOptions): Promise<BlobMultipartUpload> {
      await ensureBase()
      const uploadId = randomUUID()
      return createOrResumeMultipartUpload(dir, pathname, uploadId, options)
    },

    async resumeMultipartUpload(pathname: string, uploadId: string): Promise<BlobMultipartUpload> {
      return createOrResumeMultipartUpload(dir, pathname, uploadId)
    }
  }
}

// Multipart upload implementation for filesystem
interface MultipartMetadata {
  pathname: string
  uploadId: string
  contentType: string
  customMetadata: Record<string, string>
  parts: Array<[number, BlobUploadedPart]>
}

async function createOrResumeMultipartUpload(
  dir: string,
  pathname: string,
  uploadId: string,
  options?: BlobMultipartOptions
): Promise<BlobMultipartUpload> {
  const metaPath = join(dir, `${pathname}.mpu.${uploadId}.json`)
  const partsDir = join(dir, `.mpu.${uploadId}`)

  let metadata: MultipartMetadata

  if (options) {
    // Create new upload
    metadata = {
      pathname,
      uploadId,
      contentType: options.contentType || getContentType(pathname),
      customMetadata: options.customMetadata || {},
      parts: []
    }
    await fsp.mkdir(dirname(metaPath), { recursive: true })
    await fsp.writeFile(metaPath, JSON.stringify(metadata))
    await fsp.mkdir(partsDir, { recursive: true })
  } else {
    // Resume existing upload
    try {
      const content = await fsp.readFile(metaPath, 'utf-8')
      metadata = JSON.parse(content)
    } catch {
      throw new Error('Multipart upload not found')
    }
  }

  const parts = new Map<number, BlobUploadedPart>(metadata.parts)

  const saveMeta = async () => {
    metadata.parts = Array.from(parts.entries())
    await fsp.writeFile(metaPath, JSON.stringify(metadata))
  }

  return {
    pathname,
    uploadId,

    async uploadPart(partNumber: number, value): Promise<BlobUploadedPart> {
      // Convert value to Buffer
      let buffer: Buffer
      if (typeof value === 'string') {
        buffer = Buffer.from(value)
      } else if (value instanceof Blob) {
        buffer = Buffer.from(await value.arrayBuffer())
      } else if (value instanceof ArrayBuffer) {
        buffer = Buffer.from(value)
      } else if (ArrayBuffer.isView(value)) {
        buffer = Buffer.from(value.buffer, value.byteOffset, value.byteLength)
      } else if (value instanceof ReadableStream) {
        const chunks: Uint8Array[] = []
        const reader = value.getReader()
        while (true) {
          const { done, value: chunk } = await reader.read()
          if (done) break
          chunks.push(chunk)
        }
        buffer = Buffer.concat(chunks)
      } else {
        buffer = Buffer.from(value as any)
      }

      const partPath = join(partsDir, partNumber.toString().padStart(10, '0'))
      await fsp.writeFile(partPath, buffer)

      const uploadedPart: BlobUploadedPart = {
        partNumber,
        etag: `"${randomUUID()}"`
      }

      parts.set(partNumber, uploadedPart)
      await saveMeta()

      return uploadedPart
    },

    async complete(uploadedParts: BlobUploadedPart[]): Promise<BlobObject> {
      if (uploadedParts.length === 0) {
        throw new Error('No parts provided for completion')
      }

      // Sort parts by part number
      const sortedParts = [...uploadedParts].sort((a, b) => a.partNumber - b.partNumber)

      // Validate parts
      const expectedPartNumbers = Array.from({ length: sortedParts.length }, (_, i) => i + 1)
      for (const expectedPart of expectedPartNumbers) {
        if (!sortedParts.find(p => p.partNumber === expectedPart)) {
          throw new Error(`Missing part ${expectedPart}`)
        }
      }

      // Combine parts into final file
      const fullPath = join(dir, pathname)
      await fsp.mkdir(dirname(fullPath), { recursive: true })

      const writeStream = fs.createWriteStream(fullPath)
      for (const part of sortedParts) {
        const partPath = join(partsDir, part.partNumber.toString().padStart(10, '0'))
        await new Promise<void>((resolve, reject) => {
          const readStream = fs.createReadStream(partPath)
          readStream.pipe(writeStream, { end: false })
          readStream.on('error', reject)
          readStream.on('end', () => resolve())
        })
      }

      await new Promise<void>((resolve, reject) => {
        writeStream.end()
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
      })

      // Get final file size
      const stat = await fsp.stat(fullPath)

      // Write metadata
      const blobMeta: BlobMetadata = {
        contentType: metadata.contentType,
        size: stat.size,
        mtime: new Date(),
        customMetadata: metadata.customMetadata
      }
      await fsp.writeFile(fullPath + META_EXTENSION, JSON.stringify(blobMeta))

      // Cleanup
      await fsp.rm(partsDir, { recursive: true, force: true })
      await fsp.unlink(metaPath).catch(() => {})

      return {
        pathname,
        contentType: metadata.contentType,
        size: stat.size,
        httpEtag: `"${randomUUID()}"`,
        uploadedAt: new Date(),
        httpMetadata: {
          contentType: metadata.contentType
        },
        customMetadata: metadata.customMetadata
      }
    },

    async abort(): Promise<void> {
      await fsp.rm(partsDir, { recursive: true, force: true })
      await fsp.unlink(metaPath).catch(() => {})
    }
  }
}
