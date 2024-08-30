<script setup lang="ts">
// import destr from 'destr'
// import { useAIChat } from '../../../dist/runtime/ai/app/composables/useAIChat';

interface Message {
  role: 'ai' | 'user'
  message: string
}

const prompt = ref('')
const stream = ref(true)
const multiTurnChat = ref(true)
const loading = ref(false)
const messages = ref<Message[]>([])
const currentAIResponse = ref('')
const model = '@cf/meta/llama-3.1-8b-instruct'

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

  const response = useAIChat('/api/ai', model, {
    prompt: multiTurnChat.value ? undefined : promptToSend,
    messages: multiTurnChat.value ? messages.value.map(m => ({ role: m.role, content: m.message })) : undefined,
    stream: stream.value
  })()

  for await (const chunk of response) {
    currentAIResponse.value += chunk
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
      <div class="flex gap-x-8 mb-4 px-2">
        <div class="flex items-center gap-x-2">
          <span>Enable Streaming</span>
          <UToggle v-model="stream" />
        </div>
        <div class="flex items-center gap-x-2">
          <span>Multi-turn Chat</span>
          <UToggle v-model="multiTurnChat" />
        </div>
      </div>
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
