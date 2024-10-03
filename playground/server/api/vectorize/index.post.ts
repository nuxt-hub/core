export default eventHandler(async (event) => {
  const { query } = await readValidatedBody(event, z.object({
    query: z.array(z.number())
  }).parse)
  const index = hubVectorize('example')
  return index.query(query)
})
