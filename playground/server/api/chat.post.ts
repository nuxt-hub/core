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

  const workersAI = createWorkersAI({ binding: hubAI() })

  return streamText({
    model: workersAI('@cf/meta/llama-3.1-8b-instruct'),
    messages
  }).toDataStreamResponse({
    // headers: {
    //   // add these headers to ensure that the
    //   // response is chunked and streamed
    //   'content-type': 'text/x-unknown',
    //   'content-encoding': 'identity',
    //   'transfer-encoding': 'chunked'
    // }
  })

  // For testing purposes, we'll randomly throw an error
  // if (Math.round(Math.random()) === 1) {
  //   throw createError({
  //     status: 500,
  //     statusMessage: 'Nope'
  //   })
  // }
})
