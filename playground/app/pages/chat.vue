<script setup lang="ts">
const { user, fetch: refreshSession } = useUserSession()
const { data, send, open, status } = useWebSocket(`/api/chatroom`, { immediate: false })

const chatContainer = ref<HTMLDivElement | null>(null)
const messages = ref<{ id: string, username: string, content: string }[]>([])
watch(data, async (event) => {
  const data = await typeof event === 'string' ? event : await event.text()
  messages.value.push(data[0] === '{' ? JSON.parse(data) : data)
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
})

async function enterChat() {
  await $fetch('/api/login', {
    method: 'POST',
    body: { username: username.value }
  })
  await refreshSession()
  open()
}

const username = ref(user.value?.username || '')
const message = ref('')

onMounted(() => {
  if (user.value?.username) {
    open()
  }
})

function sendMessage() {
  send(JSON.stringify({
    username: username.value,
    content: message.value
  }))
  message.value = ''
}
</script>

<template>
  <UCard v-if="user?.username && status === 'OPEN'">
    <div ref="chatContainer" class="h-full max-h-[400px] overflow-auto">
      <div v-for="(msg, index) in messages" :key="msg.id" class="flex flex-col" :class="{ 'pt-2': index > 0 && msg.username !== messages[index - 1]?.username }">
        <div :class="msg.username === user.username ? 'pl-8 ml-auto' : 'pr-8 mr-auto'">
          <!-- only show username if previous one is not from the same user -->
          <div v-if="index < 1 || msg.username !== messages[index - 1]?.username" class="text-xs text-gray-500">
            {{ msg.username }}
          </div>
          <p
            class="p-2 mt-1 text-sm rounded-lg text-smp-2 whitespace-pre-line"
            :class="msg.username === user.username ? 'text-white bg-blue-400' : 'text-gray-700 bg-gray-200'"
          >
            {{ msg.content }}
          </p>
        </div>
      </div>
    </div>
    <form class="flex items-center w-full pt-4 gap-2" @submit.prevent="sendMessage">
      <UInput v-model="message" placeholder="Send a message..." class="w-full" />
      <UButton icon="i-heroicons-paper-airplane" type="submit" color="neutral" />
    </form>
  </UCard>
  <UCard v-else>
    <form class="flex items-center gap-2" @submit.prevent="enterChat">
      <UInput v-model="username" placeholder="Enter your username" name="username" />
      <UButton color="neutral" :disabled="!username.trim()" :loading="status === 'CONNECTING'" type="submit">
        Enter Chat
      </UButton>
    </form>
  </UCard>
</template>
