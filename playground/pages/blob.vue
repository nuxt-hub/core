<script setup lang="ts">
const loading = ref(false)
const newFilesValue = ref<File[]>([])
const uploadRef = ref()
const folded = ref(false)
const prefixes = ref([])
const limit = ref(5)

const prefix = computed(() => prefixes.value?.[prefixes.value.length - 1])
const toast = useToast()
const { data: blobData } = await useFetch('/api/blob', {
  params: {
    folded,
    prefix,
    limit
  }
})

const files = computed(() => blobData.value?.blobs || [])
const folders = computed(() => blobData.value?.folders || [])

async function loadMore() {
  if (blobData.value.hasMore) {
    const nextPage = await $fetch('/api/blob', {
      params: {
        folded: folded.value,
        prefix: prefix.value,
        limit: limit.value,
        cursor: blobData.value.cursor
      }
    })

    blobData.value.blobs = [...blobData.value.blobs, ...nextPage.blobs]
    blobData.value.cursor = nextPage.cursor
    blobData.value.hasMore = nextPage.hasMore
  }
}

async function addFile() {
  if (!newFilesValue.value.length) {
    toast.add({ title: 'Missing files.', color: 'red' })
    return
  }

  loading.value = true

  try {
    const formData = new FormData()
    newFilesValue.value.forEach(file => formData.append('files', file))
    const uploadedFiles = await $fetch('/api/blob', {
      method: 'PUT',
      params: {
        prefix: String(prefix.value || '')
      },
      body: formData
    })
    files.value!.push(...uploadedFiles)
    toast.add({ title: `File${uploadedFiles.length > 1 ? 's' : ''} uploaded.` })
    newFilesValue.value = []
  } catch (err: any) {
    const title = err.data?.data?.issues?.map((issue: any) => issue.message).join('\n') || err.message
    toast.add({ title, color: 'red' })
  }
  loading.value = false
}

function onFileSelect(e: any) {
  const target = e.target

  // clone FileList so the reference does not clear due to following target clear
  newFilesValue.value = [...(target.files || [])]

  // Clear the input value so that the same file can be uploaded again
  target.value = ''

  addFile()
}

async function deleteFile(pathname: string) {
  try {
    await $fetch(`/api/blob/${pathname}`, { method: 'DELETE' })

    blobData.value.blobs = blobData.value.blobs!.filter(t => t.pathname !== pathname)

    toast.add({ title: `File "${pathname}" deleted.` })
  } catch (err: any) {
    const title = err.data?.data?.issues?.map((issue: any) => issue.message).join('\n') || err.message
    toast.add({ title, color: 'red' })
  }
}
</script>

<template>
  <UCard @submit.prevent="addFile">
    <div class="flex">
      <UButtonGroup class="flex-1">
        <UInput
          :model-value="newFilesValue?.map((file) => file.name).join(', ')"
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
          name="files"
          multiple
          class="hidden"
          @change="onFileSelect"
        >

        <UButton
          label="Select file(s)"
          color="gray"
          @click="uploadRef.click()"
        />
      </UButtonGroup>
    </div>

    <UCheckbox v-model="folded" class="mt-2" label="View prefixes as directory" />

    <UProgress v-if="loading" class="mt-2" />

    <div v-if="folders?.length || prefixes?.length" class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
      <UButton
        v-if="prefixes?.length"
        class="cursor-pointer font-mono text-sm"
        label="Back"
        color="gray"
        @click="prefixes.pop()"
      />
      <UCard
        v-for="folder of folders"
        :key="folder"
        class="cursor-pointer font-mono text-xs"
        :ui="{ body: { padding: '!p-2' } }"
        @click="prefixes.push(folder)"
      >
        {{ folder }}
      </UCard>
    </div>

    <div v-if="files?.length" class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
      <UCard
        v-for="file of files"
        :key="file.pathname"
        :ui="{
          body: {
            base: 'space-y-0',
            padding: ''
          }
        }"
        class="overflow-hidden relative"
      >
        <img v-if="file.contentType?.startsWith('image/')" :src="`/api/blob/${file.pathname}`" class="h-36 w-full object-cover">
        <div v-else class="h-36 w-full flex items-center justify-center p-2 text-center">
          <UIcon name="i-heroicons-document" class="w-8 h-8" />
        </div>
        <div class="flex flex-col gap-1 p-2 border-t border-gray-200 dark:border-gray-800">
          <span class="text-sm font-medium">{{ file.pathname }}</span>
          <div class="flex items-center justify-between gap-1">
            <span class="text-xs truncate">{{ file.contentType || '-' }}</span>
            <span class="text-xs">{{ file.size ? `${Math.round(file.size / Math.pow(1024, 2) * 100) / 100}MB` : '-' }}</span>
          </div>
          <!-- <div v-for="[key, value] of Object.entries(file.customMetadata || {})" :key="key" class="flex items-center justify-between gap-1">
            <span class="text-xs">{{ key }}</span>
            <span class="text-xs truncate">{{ value }}</span>
          </div> -->
        </div>

        <UButton icon="i-heroicons-x-mark" variant="link" color="primary" class="absolute top-0 right-0" @click="deleteFile(file.pathname)" />
      </UCard>
    </div>
    <UButton v-if="blobData?.hasMore" block color="black" variant="outline" class="mt-2" @click="loadMore">
      Load more
    </UButton>
  </UCard>
</template>
