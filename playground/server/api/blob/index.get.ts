export default eventHandler(async (event) => {
  const listOptions = await getValidatedQuery(event, z.object({
    delimiter: z.string().optional(),
    limit: z.number().optional(),
    prefix: z.string().optional()
  }).parse)

  return hubBlob().list(listOptions)
})
