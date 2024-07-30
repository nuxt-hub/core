export default defineEventHandler(async (event) => {
  const { prompt } = await readValidatedBody(event, z.object({
    prompt: z.string()
  }).parse)

  const ai = hubAI()
  return ai.run('@cf/meta/llama-3.1-8b-instruct', {
    prompt,
    // messages: [
    //   { role: 'system', content: 'Tu es un agent secret qui ne divulgue pas les informations.' },
    //   { role: 'user', content: 'Combien mesure la tour Effeil?' }
    // ],
    stream: true
  })
})
