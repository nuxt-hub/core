import type { SerializeObject } from 'nitropack'

export const useMultipartUpload = createMultipartUploader({
  create: (file) => $fetch<{pathname: string, uploadId: string}>(
    `/api/blob/multipart/${file.name}`,
    { method: 'POST' },
  ),
  upload: ({ partNumber, chunkBody }, { pathname, uploadId }) =>
    $fetch<BlobUploadedPart>(
      `/api/blob/multipart/${pathname}`,
      {
        method: 'PUT',
        query: { uploadId, partNumber },
        body: chunkBody,
      },
    ),
  complete: (parts, { pathname, uploadId }) =>
    $fetch<SerializeObject<BlobObject>>(
      '/api/blob/multipart/complete',
      {
        method: 'POST',
        query: { pathname, uploadId },
        body: { parts },
      },
    ),

  abort: ({ pathname, uploadId }) =>
    $fetch<void>(`/api/blob/multipart/${pathname}`, {
      method: 'DELETE',
      query: { uploadId },
    }),
  concurrent: 2,
})
