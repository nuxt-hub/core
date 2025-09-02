<script setup lang="ts">
const loading = ref(false)
const loadingProgress = ref<number | undefined>(undefined)
const newFilesValue = ref<File[]>([])
const uploadRef = ref<HTMLInputElement>()
const folded = ref(false)
const prefixes = ref<string[]>([])
const limit = ref(5)

const prefix = computed(() => prefixes.value?.[prefixes.value.length - 1])
const toast = useToast()
const { data: blobData, refresh } = await useFetch('/api/blob', {
  query: {
    folded,
    prefix,
    limit
  },
  deep: true
})

const files = computed(() => blobData.value?.blobs || [])
const folders = computed(() => blobData.value?.folders || [])

async function loadMore() {
  if (!blobData.value?.hasMore) return
  const nextPage = await $fetch('/api/blob', {
    query: {
      folded: folded.value,
      prefix: prefix.value,
      limit: limit.value,
      cursor: blobData.value.cursor
    }
  })

  blobData.value.blobs = [...blobData.value.blobs, ...nextPage.blobs]
  blobData.value.folders = [...blobData.value.folders || [], ...(nextPage.folders || [])]
  blobData.value.cursor = nextPage.cursor
  blobData.value.hasMore = nextPage.hasMore
}

async function addFile() {
  if (!newFilesValue.value.length) {
    toast.add({ title: 'Missing files.', color: 'red' })
    return
  }
  loading.value = true

  try {
    const uploadedFiles = await uploadFiles(newFilesValue.value)
    files.value!.push(...uploadedFiles)
    if (uploadedFiles.length > 0) {
      toast.add({ title: `File${uploadedFiles.length > 1 ? 's' : ''} uploaded.` })
    }
    newFilesValue.value = []
  } catch (err: any) {
    const title = err.data?.data?.issues?.map((issue: any) => issue.message).join('\n') || err.message
    toast.add({ title, color: 'red' })
  }
  loading.value = false
}

async function uploadFiles(files: File[]) {
  const bigFileLimit = 10 * 1024 * 1024 // 10MB

  const bigFiles = files.filter(file => file.size > bigFileLimit)
  const smallFiles = files.filter(file => file.size <= bigFileLimit)

  let uploadedFiles: any[] = []
  // upload small files
  if (smallFiles.length) {
    uploadedFiles = await useUpload('/api/blob', {
      method: 'PUT',
      query: {
        prefix: String(prefix.value || '')
      }
    })(smallFiles)
  }

  // TODO: multipart upload
  // upload big files
  const uploadLarge = useMultipartUpload('/api/blob/multipart', {
    concurrent: 2,
    prefix: String(prefix.value || '')
  })

  for (const file of bigFiles) {
    toast.add({ title: 'Multipart upload is not supported yet.', color: 'warning' })
    continue

    const { completed, progress, abort } = uploadLarge(file)

    const uploadingToast = toast.add({
      title: `Uploading ${file.name}...`,
      description: file.name,
      color: 'info',
      duration: 0,
      close: {
        color: 'error',
        variant: 'solid',
        onClick() {
          console.log('clicked')
          if (progress.value !== 100) {
            abort()
          }
        }
      }
    })
    const stopWatch = watch(progress, v => loadingProgress.value = v / 100)

    const complete = await completed

    stopWatch()
    loadingProgress.value = undefined
    toast.remove(uploadingToast.id)

    if (complete) {
      uploadedFiles.push(complete)
    } else {
      toast.add({
        title: `Failed to upload ${file.name}.`,
        color: 'red'
      })
    }
  }

  return uploadedFiles
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
    // @ts-expect-error method DELETE is not typed
    await $fetch(`/api/blob/${pathname}`, { method: 'DELETE' })

    blobData.value!.blobs = blobData.value!.blobs!.filter(t => t.pathname !== pathname)

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
          :model-value="newFilesValue?.map((file: File) => file.name).join(', ')"
          name="fileValue"
          disabled
          class="flex-1"
          autocomplete="off"
          :ui="{ wrapper: 'flex-1' }"
        />
        <input
          ref="uploadRef"
          tabindex="-1"
          type="file"
          name="files"
          multiple
          class="hidden"
          @change="onFileSelect"
        >

        <UButton
          label="Select file(s)"
          color="neutral"
          variant="subtle"
          @click="uploadRef?.click()"
        />
      </UButtonGroup>
    </div>

    <div class="flex items-center gap-6 mt-2">
      <UCheckbox v-model="folded" label="View prefixes as directory" />
    </div>

    <UProgress v-if="loading" :value="loadingProgress" :max="1" class="mt-2" />

    <div v-if="folders?.length || prefixes?.length" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
      <UButton
        v-if="prefixes?.length"
        class="cursor-pointer font-mono text-sm"
        label="Back"
        color="neutral"
        variant="subtle"
        @click="prefixes.pop()"
      />
      <UCard
        v-for="folder of folders"
        :key="folder"
        class="cursor-pointer font-mono text-xs"
        @click="prefixes.push(folder)"
      >
        {{ folder }}
      </UCard>
    </div>

    <div v-if="files?.length" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
      <UCard
        v-for="file of files"
        :key="file.pathname"
        class="overflow-hidden relative group"
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

        <UButton icon="i-lucide-trash" size="sm" variant="subtle" color="error" class="hidden group-hover:block absolute top-2 right-2" @click="deleteFile(file.pathname)" />
      </UCard>
    </div>
    <UButton v-if="blobData?.hasMore" block color="neutral" variant="subtle" class="mt-2" @click="loadMore">
      Load more
    </UButton>
  </UCard>
</template>
