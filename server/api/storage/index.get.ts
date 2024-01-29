export default eventHandler(async (event) => {
  await requireUserSession(event)

  // List files for the current user

  const bucket = useBucket()
  return serveFiles(bucket)
})
