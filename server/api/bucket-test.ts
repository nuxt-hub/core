export default eventHandler(async (event) => {
  const bucket = useBucket()

  await bucket.put('test2.txt', 'Hello World!', {
    httpMetadata: {
      contentType: 'text/plain'
    }
  })

  return serveFiles(bucket)
})