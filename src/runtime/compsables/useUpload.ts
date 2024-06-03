import type { FetchOptions } from 'ofetch'
import type { BlobObject } from '../server/utils/blob'

interface UploadOptions extends FetchOptions {
  /**
   * The key to add the file/files to the request form.
   * @default 'file'
   */
  formKey?: string

  /**
   * Whether to allow multiple files to be uploaded.
   * @default true
   */
  multiple?: boolean
}

export function useUpload(apiBase: string, options: UploadOptions & { multiple: false }): (data: FileList | HTMLInputElement | File[] | File) => Promise<BlobObject>
export function useUpload(apiBase: string, options: UploadOptions): ((data: File) => Promise<BlobObject>) & ((data: FileList | HTMLInputElement | File[]) => Promise<BlobObject[]>)
export function useUpload(apiBase: string, options: UploadOptions = {}) {
  const { formKey = 'file', multiple = true, method, ...fetchOptions } = options || {}

  async function upload(data: File): Promise<BlobObject>
  async function upload(data: FileList | HTMLInputElement | File[] | File): Promise<BlobObject[] | BlobObject> {
    if (data instanceof HTMLInputElement) {
      data = data.files!
    }
    if (data instanceof File) {
      data = [data]
    }
    if (!data || !data.length) {
      throw createError({ statusCode: 400, message: 'Missing files' })
    }

    const formData = new FormData()
    if (multiple) {
      for (const file of data) {
        formData.append(formKey, file)
      }
    } else {
      formData.append(formKey, data[0])
    }

    return $fetch<BlobObject[]>(apiBase, {
      ...fetchOptions,
      method: (method || 'POST') as any,
      body: formData
    }).then(result => (multiple === false || data instanceof File) ? result[0] : result)
  }

  return upload
}
