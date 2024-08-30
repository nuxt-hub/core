export default defineEventHandler(async (event) => {
  const { model, params } = await readValidatedBody(event, z.object({
    model: z.string().min(1).max(1e6).trim(),
    params: z.record(z.string(), z.any()).optional()
  }).parse)

  const ai = hubAI()

  // @ts-expect-error Ai type defines all the compatible models, however Zod is only validating for string
  return ai.run(model, params)
})
