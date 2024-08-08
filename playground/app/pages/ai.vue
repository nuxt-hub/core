<script setup lang="ts">
import destr from 'destr'

interface Message {
  role: 'ai' | 'user'
  message: string
}

const prompt = ref('')
const loading = ref(false)
const messages = ref<Message[]>([])
const currentAIResponse = ref('')

async function sendPrompt() {
  if (loading.value) return
  loading.value = true
  currentAIResponse.value = ''
  messages.value.push({
    role: 'user',
    message: prompt.value
  })
  const promptToSend = prompt.value
  prompt.value = ''
  const body = await $fetch('/api/ai', {
    method: 'POST',
    responseType: 'stream',
    body: {
      prompt: promptToSend
    }
  })
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let result = await reader.read()
  while (!result.done) {
    const text = decoder.decode(result.value)
    for (const line of text.split('\n')) {
      if (!line) continue
      const data: any = destr(line.replace('data: ', '')) || {}
      if (data?.response) {
        currentAIResponse.value += data.response
      }
    }
    result = await reader.read()
  }
  messages.value.push({
    role: 'ai',
    message: currentAIResponse.value
  })
  currentAIResponse.value = ''
  loading.value = false
}
</script>

<template>
  <UCard>
    <div class="h-full overflow-auto chat-messages">
      <div v-for="(message, i) in messages" :key="i" class="flex flex-col p-4">
        <div v-if="message.role === 'ai'" class="pr-8 mr-auto">
          <div class="p-2 mt-1 text-sm text-gray-700 bg-gray-200 rounded-lg text-smp-2 whitespace-pre-line">
            {{ message.message }}
          </div>
        </div>
        <div v-else class="pl-8 ml-auto">
          <div class="p-2 mt-1 text-sm text-white bg-blue-400 rounded-lg whitespace-pre-line">
            {{ message.message }}
          </div>
        </div>
      </div>
      <div v-if="currentAIResponse" class="flex flex-col p-4">
        <div class="pr-8 mr-auto">
          <div class="p-2 mt-1 text-sm text-gray-700 bg-gray-200 rounded-lg text-smp-2 whitespace-pre-line">
            {{ currentAIResponse }}
          </div>
        </div>
      </div>
    </div>
    <form class="flex items-center w-full p-2 gap-2" @submit.prevent="sendPrompt">
      <UInput
        v-model="prompt"
        type="text"
        placeholder="Type here..."
        class="w-full"
        :disabled="loading"
      />
      <UButton
        :loading="loading"
        icon="i-heroicons-paper-airplane"
        type="submit"
        color="black"
      />
    </form>
  </UCard>
</template>
