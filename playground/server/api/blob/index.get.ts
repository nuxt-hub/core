export default eventHandler(async (event) => {
  const listOptions = await getValidatedQuery(event, z.object({
    folded: z.string().toLowerCase().transform(x => x === 'true').optional(),
    limit: z.string().transform(x => Number.parseInt(x)).optional(),
    prefix: z.string().optional(),
    cursor: z.string().optional()
  }).parse)

  return hubBlob().list(listOptions)
})
