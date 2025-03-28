<script setup lang="ts">
import { useChat } from '@ai-sdk/vue'

const { messages, input, handleSubmit, isLoading, stop, error, reload } = useChat()
</script>

<template>
  <UCard>
    <div class="h-full overflow-auto">
      <div v-for="message in messages" :key="message.id" class="flex flex-col p-4">
        <div :class="message.role === 'assistant' ? 'pr-8 mr-auto' : 'pl-8 ml-auto'">
          <MDC
            class="p-2 mt-1 text-sm rounded-lg text-smp-2 whitespace-pre-line"
            :class="message.role === 'assistant' ? 'text-white bg-blue-400' : 'text-gray-700 bg-gray-200'"
            :value="message.content"
            :cache-key="message.id"
          />
        </div>
      </div>
      <div v-if="error" class="flex items-center justify-center gap-2">
        <div class="text-red-500">
          {{ 'An error occurred' }}
        </div>
        <UButton color="neutral" variant="subtle" size="xs" @click="reload()">
          retry
        </UButton>
      </div>
    </div>
    <form class="flex items-center w-full p-2 gap-2" @submit.prevent="handleSubmit">
      <UInput v-model="input" placeholder="Type here..." class="w-full" :disabled="Boolean(error)" />
      <UButton v-if="isLoading" icon="i-heroicons-stop" color="neutral" @click="stop" />
      <UButton v-else icon="i-heroicons-paper-airplane" type="submit" color="neutral" />
    </form>
  </UCard>
</template>
