export interface BlobObject {
  pathname: string
  contentType: string | undefined
  size: number
  uploadedAt: Date
}
