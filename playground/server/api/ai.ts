export default defineEventHandler(async () => {
  const ai = hubAi()
  return await ai.run('@cf/meta/llama-3-8b-instruct', {
    prompt: 'Who is the author of Nuxt?'
  })
})
