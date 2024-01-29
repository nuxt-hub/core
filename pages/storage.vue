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
    formData.append('data', new Blob([JSON.stringify({ key })], { type: 'application/json' }))
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
    newFileKey.value = files[0].name
  }

  // Clear the input value so that the same file can be uploaded again
  target.value = ''
}

async function deleteFile (key) {
  try {
    await useFetch(`/api/storage/${key}`, { method: 'DELETE' })
    storage.value = storage.value.filter(t => t.key !== key)
    toast.add({ title: `File "${key}" deleted.` })
  } catch (err) {
    if (err.data?.data?.issues) {
      const title = err.data.data.issues.map(issue => issue.message).join('\n')
      toast.add({ title, color: 'red' })
    }
  }
}

onMounted(async () => {
  // FIXME
  // storage.value = await Promise.all(storage.value.map(async (file) => {
  //   const { data: { body } } = await useFetch(`/api/storage/${file.key}`, { params: { populate: true } })
  //   return {
  //     ...file,
  //     body
  //   }
  // }))
})

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
      <UInput
        :model-value="newFileValue?.name"
        name="fileValue"
        disabled
        class="flex-1"
        autocomplete="off"
        :ui="{ wrapper: 'flex-1' }"
      />
      <input
        ref="uploadRef"
        tabindex="-1"
        accept="jpeg, png"
        type="file"
        name="file"
        class="hidden"
        @change="onFileSelect"
      >

      <UButton
        label="Select file"
        @click="uploadRef.click()"
      />

      <UButton type="submit" icon="i-heroicons-plus-20-solid" :loading="loading" :disabled="false" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
      <UCard
        v-for="file of storage"
        :key="file.key"
        :ui="{
          body: {
            base: 'space-y-0',
            padding: ''
          }
        }"
        class="overflow-hidden relative"
      >
        <img v-if="file.httpMetadata?.contentType?.startsWith('image/') && file.body" :src="`data:${file.httpMetadata.contentType};base64,${(file.body)}`" class="h-36 w-full object-cover">
        <div v-else class="h-36 w-full flex items-center justify-center">
          {{ file.key }}
        </div>
        <div class="flex flex-col gap-1 p-2 border-t border-gray-200 dark:border-gray-800">
          <span class="text-sm font-medium">{{ file.key }}</span>
          <div class="flex items-center justify-between">
            <span class="text-xs">{{ file.httpMetadata?.contentType || '-' }}</span>
            <span class="text-xs">{{ file.size ? `${Math.round(file.size / Math.pow(1024, 2) * 100) / 100}MB` : '-' }}</span>
          </div>
        </div>

        <UButton icon="i-heroicons-x-mark" variant="link" color="primary" class="absolute top-0 right-0" @click="deleteFile(file.key)" />
      </UCard>
    </div>
  </UCard>
</template>
