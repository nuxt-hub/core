import { createError } from 'h3'
import type { FetchOptions } from 'ofetch'
import type { BlobObject } from '@nuxthub/core'

interface UploadOptions extends FetchOptions {
  /**
   * The key to add the file/files to the request form.
   * @default 'files'
   */
  formKey?: string

  /**
   * Whether to allow multiple files to be uploaded.
   * @default true
   */
  multiple?: boolean
}

/**
 * Upload a file or files to the server using FormData.
 * @param apiBase the base URL of the API to handle the upload.
 * @param options the options to use for the upload.
 * @see https://hub.nuxt.com/docs/features/blob#useupload
 */
export function useUpload(apiBase: string, options?: UploadOptions & { multiple: false }): (data: FileList | HTMLInputElement | File[] | File) => Promise<BlobObject>
export function useUpload(apiBase: string, options?: UploadOptions): ((data: File) => Promise<BlobObject>) & ((data: FileList | HTMLInputElement | File[]) => Promise<BlobObject[]>)
export function useUpload(apiBase: string, options: UploadOptions = {}) {
  const { formKey = 'files', multiple = true, method, ...fetchOptions } = options || {}

  async function upload(data: File): Promise<BlobObject>
  async function upload(data: FileList | HTMLInputElement | File[] | File): Promise<BlobObject[] | BlobObject> {
    let files: File[] = Array.isArray(data) ? data : []
    if (String((data as HTMLInputElement)?.files).includes('FileList')) {
      files = Array.from((data as HTMLInputElement).files!)
    }
    if (data instanceof File) {
      files = [data]
    }
    if (typeof FileList !== 'undefined' && data instanceof FileList) {
      files = Array.from(data)
    }
    if (!files || !(files as Array<File>).length) {
      throw createError({ statusCode: 400, message: 'Missing files' })
    }

    const formData = new FormData()
    if (multiple) {
      for (const file of files) {
        formData.append(formKey, file)
      }
    } else {
      formData.append(formKey, files[0])
    }

    return $fetch(apiBase, {
      ...fetchOptions,
      method: (method || 'POST') as any,
      body: formData
    }).then(result => (multiple === false || data instanceof File) ? (result as any)[0] : result)
  }

  return upload
}
