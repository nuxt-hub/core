import { AIStream, formatStreamPart } from 'ai'

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  const stream = await hubAI().run('@cf/meta/llama-3.1-8b-instruct', {
    messages,
    stream: true
  }) as ReadableStream

  // For testing purposes, we'll randomly throw an error
  // if (Math.round(Math.random()) === 1) {
  //   throw createError({
  //     status: 500,
  //     statusMessage: 'Nope'
  //   })
  // }

  return AIStream(new Response(stream), data => formatStreamPart('text', JSON.parse(data).response))
})
