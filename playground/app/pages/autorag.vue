<script setup lang="ts">
const query = ref('')
const loading = ref(false)
const response = ref('')
async function askAutorag() {
  loading.value = true
  const data = await $fetch('/api/autorag', {
    method: 'POST',
    body: { query: query.value }
  })
  response.value = data.response
  loading.value = false
}
</script>

<template>
  <UCard>
    <form class="flex items-center w-full p-2 gap-2" @submit.prevent="askAutorag">
      <UInput v-model="query" placeholder="Ask me a question about NuxtHub..." class="w-full" />
      <UButton :loading="loading" icon="i-heroicons-paper-airplane" type="submit" color="neutral" />
    </form>
    <div v-if="response" class="p-2">
      <MDC :value="response" />
    </div>
  </UCard>
</template>
