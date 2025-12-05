import { createError } from 'h3'
import type { BlobType, FileSizeUnit } from '../types'
import type { BlobEnsureOptions } from '../types/index'

// Credits from shared utils of https://github.com/pingdotgg/uploadthing
const FILESIZE_UNITS = ['B', 'KB', 'MB', 'GB']

/**
 * Ensure the blob is valid and meets the specified requirements.
 *
 * @param blob The blob to check
 * @param options The options to check against
 * @param options.maxSize The maximum size of the blob (e.g. '1MB')
 * @param options.types The allowed types of the blob (e.g. ['image/png', 'application/json', 'video'])
 *
 * @throws If the blob does not meet the requirements
 */
export function ensureBlob(blob: Blob, options: BlobEnsureOptions = {}) {
  if (!options.maxSize && !options.types?.length) {
    throw createError({
      statusCode: 400,
      message: 'ensureBlob() requires at least one of maxSize or types to be set.'
    })
  }
  if (options.maxSize) {
    const maxFileSizeBytes = fileSizeToBytes(options.maxSize)
    if (blob.size > maxFileSizeBytes) {
      throw createError({
        statusCode: 400,
        message: `File size must be less than ${options.maxSize}`
      })
    }
  }
  const blobShortType = blob.type.split('/')[0]
  if (options.types?.length
    && !options.types.includes(blob.type as BlobType)
    && !options.types.includes(blobShortType as BlobType)
    && !(options.types.includes('pdf' as BlobType) && blob.type === 'application/pdf')
  ) {
    throw createError({
      statusCode: 400,
      message: `File type is invalid, must be: ${options.types.join(', ')}`
    })
  }
}

function fileSizeToBytes(input: string) {
  const regex = new RegExp(
    `^(\\d+)(\\.\\d+)?\\s*(${FILESIZE_UNITS.join('|')})$`,
    'i'
  )
  const match = input.match(regex)

  if (!match) {
    throw createError({ statusCode: 400, message: `Invalid file size format: ${input}` })
  }

  const sizeValue = Number.parseFloat(match[1]!)
  const sizeUnit = match[3]!.toUpperCase() as FileSizeUnit

  if (!FILESIZE_UNITS.includes(sizeUnit)) {
    throw createError({ statusCode: 400, message: `Invalid file size unit: ${sizeUnit}` })
  }
  const bytes = sizeValue * Math.pow(1024, FILESIZE_UNITS.indexOf(sizeUnit))
  return Math.floor(bytes)
}
