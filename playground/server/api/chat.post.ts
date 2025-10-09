import { convertToModelMessages, streamText } from 'ai'

defineRouteMeta({
  openAPI: {
    description: 'Chat with AI.',
    tags: ['ai']
  }
})

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  return streamText({
    model: hubAI('@cf/meta/llama-3.1-8b-instruct'),
    messages: convertToModelMessages(messages),
    onError(res) {
      console.error(res.error)
    }
  }).toUIMessageStreamResponse()
})
