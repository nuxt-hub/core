export default eventHandler(async (event) => {
  const { query } = await getValidatedQuery(event, z.object({
    query: z.array(z.number())
  }).parse)
  return hubVectorize('example')?.query(query)
})
