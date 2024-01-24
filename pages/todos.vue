<script setup>
definePageMeta({
  middleware: 'auth'
})
const loading = ref(false)
const newTodo = ref('')
const newTodoInput = ref(null)

const toast = useToast()
const { user, clear } = useUserSession()
const { data: todos } = await useFetch('/api/todos')

async function addTodo () {
  if (!newTodo.value.trim()) { return }

  loading.value = true

  try {
    const todo = await $fetch('/api/todos', {
      method: 'POST',
      body: {
        title: newTodo.value,
        completed: 0
      }
    })
    todos.value.push(todo)
    toast.add({ title: `Todo "${todo.title}" created.` })
    newTodo.value = ''
    nextTick(() => {
      newTodoInput.value?.input?.focus()
    })
  } catch (err) {
    if (err.data?.data?.issues) {
      const title = err.data.data.issues.map(issue => issue.message).join('\n')
      toast.add({ title, color: 'red' })
    }
  }
  loading.value = false
}

async function toggleTodo (todo) {
  todo.completed = Number(!todo.completed)
  await useFetch(`/api/todos/${todo.id}`, {
    method: 'PATCH',
    body: {
      completed: todo.completed
    }
  })
}

async function deleteTodo (todo) {
  await useFetch(`/api/todos/${todo.id}`, { method: 'DELETE' })
  todos.value = todos.value.filter(t => t.id !== todo.id)
  toast.add({ title: `Todo "${todo.title}" deleted.` })
}

const items = [[{
  label: 'Logout',
  icon: 'i-heroicons-arrow-left-on-rectangle',
  click: clear
}]]
</script>

<template>
  <UCard @submit.prevent="addTodo">
    <template #header>
      <h3 class="text-lg font-semibold leading-6">
        <NuxtLink to="/">
          Todo List
        </NuxtLink>
      </h3>

      <UDropdown v-if="user" :items="items">
        <UButton color="white" trailing-icon="i-heroicons-chevron-down-20-solid">
          <UAvatar :src="`https://github.com/${user.login}.png`" :alt="user.login" size="3xs" />
          {{ user.login }}
        </UButton>
      </UDropdown>
    </template>

    <div class="flex items-center gap-2">
      <UInput
        ref="newTodoInput"
        v-model="newTodo"
        name="todo"
        :disabled="loading"
        class="flex-1"
        placeholder="Make a Nuxt demo"
        autocomplete="off"
        autofocus
        :ui="{ wrapper: 'flex-1' }"
      />

      <UButton type="submit" icon="i-heroicons-plus-20-solid" :loading="loading" :disabled="newTodo.trim().length === 0" />
    </div>

    <ul class="divide-y divide-gray-200 dark:divide-gray-800">
      <li
        v-for="todo of todos"
        :key="todo.id"
        class="flex items-center gap-4 py-2"
      >
        <span class="flex-1 font-medium" :class="[todo.completed ? 'line-through text-gray-500' : '']">{{ todo.title }}</span>

        <UToggle :model-value="Boolean(todo.completed)" @update:model-value="toggleTodo(todo)" />

        <UButton
          color="red"
          variant="soft"
          size="2xs"
          icon="i-heroicons-x-mark-20-solid"
          @click="deleteTodo(todo)"
        />
      </li>
    </ul>
  </UCard>
</template>
