<script setup>
definePageMeta({
  middleware: 'auth'
})
const loading = ref(false)
const newFileKey = ref('')
const newFileValue = ref()
const newFileKeyInput = ref()
const uploadRef = ref()

const toast = useToast()
const { user, clear } = useUserSession()
const { data: storage } = await useFetch('/api/storage')

async function addFile () {
  const key = newFileKey.value.trim().replace(/\s/g, '-')
  if (!key || !newFileValue.value) {
    toast.add({ title: `Missing ${!key ? 'key' : 'file'}.`, color: 'red' })
    return
  }

  loading.value = true

  try {
    const formData = new FormData()
    formData.append('data', new Blob([JSON.stringify({ key })], {type: 'application/json'}))
    formData.append('file', newFileValue.value)
    const file = await $fetch('/api/storage', {
      method: 'PUT',
      body: formData
    })
    const fileIndex = storage.value.findIndex(e => e.key === file.key)
    if (fileIndex !== -1) {
      storage.value.splice(fileIndex, 1, file)
    } else {
      storage.value.push(file)
    }
    toast.add({ title: `File "${key}" created.` })
    newFileKey.value = ''
    newFileValue.value = null
    nextTick(() => {
      newFileKeyInput.value?.input?.focus()
    })
  } catch (err) {
    if (err.data?.data?.issues) {
      const title = err.data.data.issues.map(issue => issue.message).join('\n')
      toast.add({ title, color: 'red' })
    }
  }
  loading.value = false
}

function onFileSelect (e) {
  const target = e.target

  // clone FileList so the reference does not clear due to following target clear
  const files = [...(target.files || [])]
  if (files.length) {
    newFileValue.value = files[0]
    if (!newFileKey.value.trim()) {
      newFileKey.value = files[0].name
    }
  }

  // Clear the input value so that the same file can be uploaded again
  // target.value = ''
}

const items = [[{
  label: 'Logout',
  icon: 'i-heroicons-arrow-left-on-rectangle',
  click: clear
}]]
</script>

<template>
  <UCard @submit.prevent="addFile">
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
        ref="newFileKeyInput"
        v-model="newFileKey"
        name="fileKey"
        :disabled="loading"
        class="flex-1"
        placeholder="key"
        autocomplete="off"
        autofocus
        :ui="{ wrapper: 'flex-1' }"
      />
      <input
        ref="uploadRef"
        tabindex="-1"
        accept="jpeg, png"
        type="file"
        name="file"
        class="flex-1"
        @change="onFileSelect"
      >

      <UButton type="submit" icon="i-heroicons-plus-20-solid" :loading="loading" :disabled="false" />
    </div>

    <ul class="divide-y divide-gray-200 dark:divide-gray-800">
      <li
        v-for="(file, index) of storage"
        :key="index"
        class="flex items-center gap-4 py-2"
      >
        <span class="flex-1 font-medium">{{ file.key }}</span>
      </li>
    </ul>
  </UCard>
</template>
