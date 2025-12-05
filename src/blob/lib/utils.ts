import mime from 'mime'

export async function streamToArrayBuffer(stream: ReadableStream, streamSize: number) {
  const result = new Uint8Array(streamSize)
  let bytesRead = 0
  const reader = stream.getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    result.set(value, bytesRead)
    bytesRead += value.length
  }
  return result
}

export function getContentType(pathOrExtension?: string) {
  return (pathOrExtension && mime.getType(pathOrExtension)) || 'application/octet-stream'
}
