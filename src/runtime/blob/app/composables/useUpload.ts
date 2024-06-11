import { createError } from 'h3'
import type { FetchOptions } from 'ofetch'
import type { BlobObject } from '../../../../types/blob'

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

  /**
   * The prefix to use for the blobs pathname.
   */
  prefix?: string
}

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
    if (!data || !(data as Array<File>).length) {
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
      params: {
        ...fetchOptions.params,
        prefix: options.prefix
      },
      body: formData
    }).then(result => (multiple === false || data instanceof File) ? result[0] : result)
  }

  return upload
}
