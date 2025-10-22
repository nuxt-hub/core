import { convertToModelMessages, streamText } from 'ai'

defineRouteMeta({
  openAPI: {
    description: 'Chat with AI.',
    tags: ['ai']
  }
})

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)
  const aiProvider = useRuntimeConfig().hub.ai

  return streamText({
    model: hubAI(aiProvider === 'cloudflare' ? '@cf/meta/llama-3.1-8b-instruct' : 'openai/gpt-5-nano'),
    messages: convertToModelMessages(messages),
    onError(res) {
      console.error(res.error)
    }
  })
  .toUIMessageStreamResponse({
    headers: {
      'Content-Type': 'text/x-unknown',
      'content-encoding': 'identity',
      'transfer-encoding': 'chunked',
    },
  })

})
