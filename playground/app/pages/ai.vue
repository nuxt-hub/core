<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { getTextFromMessage } from '@nuxt/ui/utils/ai'

const input = ref('')
const chat = new Chat({})

const handleSubmit = (e: Event) => {
  e.preventDefault()
  chat.sendMessage({ text: input.value })
  input.value = ''
}
</script>

<template>
  <UCard>
    <UChatMessages
      :messages="chat.messages"
      :status="chat.status"
      class="lg:pt-(--ui-header-height) pb-4 sm:pb-6"
      :spacing-offset="160"
    >
      <template #content="{ message }">
        <div class="space-y-4">
          <template v-for="(part, index) in message.parts" :key="`${part.type}-${index}-${message.id}`">
            <UButton
              v-if="part.type === 'reasoning' && part.state !== 'done'"
              label="Thinking..."
              variant="link"
              color="neutral"
              class="p-0"
              loading
            />
          </template>
          <MDCCached
            :value="getTextFromMessage(message)"
            :cache-key="message.id"
            unwrap="p"
            :parser-options="{ highlight: false }"
          />
        </div>
      </template>
    </UChatMessages>

    <UChatPrompt
      v-model="input"
      :error="chat.error"
      variant="subtle"
      class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
      @submit="handleSubmit"
    >
      <UChatPromptSubmit
        :status="chat.status"
        color="neutral"
        @stop="chat.stop"
        @reload="chat.regenerate"
      />
    </UChatPrompt>
  </UCard>
</template>
