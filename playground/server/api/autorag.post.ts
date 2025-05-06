defineRouteMeta({
  openAPI: {
    description: 'Query your data with AutoRAG.',
    tags: ['ai']
  }
})

export default defineEventHandler(async (event) => {
  const { query } = await readValidatedBody(event, z.object({
    query: z.string()
  }).parse)

  return hubAutoRAG('nuxthub-playground').aiSearch({
    query
  })
})
