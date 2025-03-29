import { streamText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

defineRouteMeta({
  openAPI: {
    description: 'Chat with AI.',
    tags: ['ai']
  }
})

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  const workersAI = createWorkersAI({
    binding: hubAI(),
    gateway: {
      id: 'playground',
      cacheTtl: 60 * 60 // 1 hour
    }
  })

  // return hubAI().run('@cf/meta/llama-3.1-8b-instruct', {
  //   messages
  // }, {
  //   gateway: {
  //     id: 'playground'
  //   }
  // })

  return streamText({
    model: workersAI('@cf/meta/llama-3.1-8b-instruct'),
    messages,
    onError(res) {
      console.error(res.error)
    }
  }).toDataStreamResponse()

  // For testing purposes, we'll randomly throw an error
  // if (Math.round(Math.random()) === 1) {
  //   throw createError({
  //     status: 500,
  //     statusMessage: 'Nope'
  //   })
  // }
})
