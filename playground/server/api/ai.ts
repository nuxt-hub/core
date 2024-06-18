export default defineEventHandler(async () => {
  const ai = hubAi()
  return await ai.run('@cf/meta/llama-2-7b-chat-int8', {
    prompt: 'Who is the author of Nuxt?'
  })
})
