export default defineEventHandler(async () => {
  const ai = hubAI()
  return await ai.run('@cf/meta/llama-3-8b-instruct', {
    prompt: 'Who is the author of Nuxt?'
  })
})
