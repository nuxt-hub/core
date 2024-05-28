export default eventHandler(async (event) => {
  const listOptions = await getValidatedQuery(event, z.object({
    folded: z.string().toLowerCase().transform(x => x === 'true').optional(),
    limit: z.number().optional(),
    prefix: z.string().optional()
  }).parse)

  return hubBlob().list(listOptions)
})
