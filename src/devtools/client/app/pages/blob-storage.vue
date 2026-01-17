<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEventListener, useClipboard, useDropZone } from '@vueuse/core'
import { useToast } from '@nuxt/ui/runtime/composables/useToast'
import { useApiBase } from '~/composables/useApiBase'

interface BlobObject { pathname: string, contentType: string, size: number, uploadedAt: string, customMetadata?: Record<string, string> }
interface BlobFolder { pathname: string, isFolder: true }
type BlobItem = BlobObject | BlobFolder
type SortKey = 'name' | 'size' | 'date'
type ViewMode = 'table' | 'grid'

const toast = useToast()
const apiBase = useApiBase()
const { copy } = useClipboard()
const prefix = ref('')
const deleteOpen = ref(false)
const selectedBlob = ref<BlobObject | null>(null)
const previewOpen = ref(false)
const previewUrl = ref('')
const uploadRef = ref<HTMLInputElement>()
const newFolderOpen = ref(false)
const newFolderName = ref('')
const moveOpen = ref(false)
const movePath = ref('')
const renameOpen = ref(false)
const renameName = ref('')
const search = ref('')
const sortBy = ref<SortKey>('name')
const viewMode = ref<ViewMode>('table')
const selectedItems = ref<Set<string>>(new Set())
const containerRef = ref<HTMLElement>()

const sortOptions = [
  { label: 'Name', value: 'name', icon: 'i-lucide-arrow-down-a-z' },
  { label: 'Size', value: 'size', icon: 'i-lucide-arrow-down-wide-narrow' },
  { label: 'Date', value: 'date', icon: 'i-lucide-calendar-arrow-down' }
]

const { data, status, refresh } = await useFetch<{ blobs: BlobObject[], folders: string[] }>(
  () => `${apiBase.value}/_hub/devtools/blob`,
  {
    query: { prefix, folded: 'true' },
    watch: [prefix],
    onResponse: () => selectedItems.value.clear(),
    onResponseError: () => toast.add({ title: 'Failed to fetch blobs', color: 'error' })
  }
)

const loading = computed(() => status.value === 'pending')

const items = computed<BlobItem[]>(() => {
  if (!data.value) return []
  const folders: BlobFolder[] = (data.value.folders || []).map(f => ({ pathname: f, isFolder: true }))
  return [...folders, ...(data.value.blobs || [])]
})

const breadcrumbItems = computed(() => {
  const crumbs = [{ label: '', icon: 'i-lucide-home', onClick: () => goToFolder('') }]
  if (!prefix.value) return crumbs
  prefix.value.split('/').filter(Boolean).forEach((part, i, arr) => {
    crumbs.push({ label: part, onClick: () => goToFolder(arr.slice(0, i + 1).join('/') + '/') })
  })
  return crumbs
})

const filteredItems = computed(() => {
  let result = items.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i => i.pathname.toLowerCase().includes(q))
  }
  return result.sort((a, b) => {
    const aFolder = isFolder(a)
    const bFolder = isFolder(b)
    if (aFolder && !bFolder) return -1
    if (!aFolder && bFolder) return 1
    if (sortBy.value === 'name') return a.pathname.localeCompare(b.pathname)
    if (sortBy.value === 'size') {
      const aSize = isFolder(a) ? 0 : a.size
      const bSize = isFolder(b) ? 0 : b.size
      return bSize - aSize
    }
    if (sortBy.value === 'date') {
      const aDate = isFolder(a) ? '' : a.uploadedAt
      const bDate = isFolder(b) ? '' : b.uploadedAt
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    }
    return 0
  })
})

const hasSelection = computed(() => selectedItems.value.size > 0)
const allSelected = computed(() => items.value.length > 0 && selectedItems.value.size === items.value.filter(i => !isFolder(i)).length)

const contextMenuItems = computed(() => (item: BlobItem) => {
  if (isFolder(item)) {
    return [[
      { label: 'Open', icon: 'i-lucide-folder-open', click: () => openFolder(item) },
      { label: 'Copy path', icon: 'i-lucide-copy', click: () => copyPath(item.pathname) }
    ]]
  }
  return [[
    { label: 'Preview', icon: 'i-lucide-eye', click: () => openPreview(item) },
    { label: 'Download', icon: 'i-lucide-download', click: () => downloadBlob(item) },
    { label: 'Copy path', icon: 'i-lucide-copy', click: () => copyPath(item.pathname) }
  ], [
    { label: 'Rename', icon: 'i-lucide-pencil', click: () => openRename(item) },
    { label: 'Move', icon: 'i-lucide-folder-input', click: () => openMove(item) }
  ], [
    { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const, click: () => openDelete(item) }
  ]]
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function isFolder(item: BlobItem): item is BlobFolder {
  return 'isFolder' in item
}

function getIcon(item: BlobItem): string {
  if (isFolder(item)) return 'i-lucide-folder'
  if (item.contentType.startsWith('image/')) return 'i-lucide-image'
  if (item.contentType.startsWith('video/')) return 'i-lucide-video'
  if (item.contentType.startsWith('audio/')) return 'i-lucide-music'
  if (item.contentType.includes('pdf')) return 'i-lucide-file-text'
  if (item.contentType.includes('json') || item.contentType.includes('text')) return 'i-lucide-file-code'
  return 'i-lucide-file'
}

function getThumbnailUrl(item: BlobObject): string | null {
  if (item.contentType.startsWith('image/')) {
    return `${apiBase.value}/_hub/devtools/blob/${item.pathname}`
  }
  return null
}

function goToFolder(path: string) {
  prefix.value = path
}

function openFolder(item: BlobFolder) {
  goToFolder(item.pathname)
}

function openPreview(item: BlobObject) {
  selectedBlob.value = item
  previewUrl.value = `${apiBase.value}/_hub/devtools/blob/${item.pathname}`
  previewOpen.value = true
}

function downloadBlob(item: BlobObject) {
  const link = document.createElement('a')
  link.href = `${apiBase.value}/_hub/devtools/blob/${item.pathname}`
  link.download = item.pathname.split('/').pop() || 'file'
  link.click()
}

function openDelete(item: BlobObject) {
  selectedBlob.value = item
  deleteOpen.value = true
}

function openMove(item: BlobObject) {
  selectedBlob.value = item
  movePath.value = item.pathname.split('/').slice(0, -1).join('/')
  if (movePath.value) movePath.value += '/'
  moveOpen.value = true
}

function openRename(item: BlobObject) {
  selectedBlob.value = item
  renameName.value = item.pathname.split('/').pop() || ''
  renameOpen.value = true
}

async function copyPath(path: string) {
  await copy(path)
  toast.add({ title: 'Copied to clipboard', color: 'success' })
}

async function confirmDelete() {
  if (!selectedBlob.value) return
  try {
    await $fetch(`${apiBase.value}/_hub/devtools/blob/${selectedBlob.value.pathname}`, { method: 'DELETE' })
    toast.add({ title: 'Deleted', color: 'success' })
    deleteOpen.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Failed to delete', color: 'error' })
  }
}

async function confirmMove() {
  if (!selectedBlob.value) return
  const filename = selectedBlob.value.pathname.split('/').pop()
  const newPath = movePath.value ? `${movePath.value.replace(/\/$/, '')}/${filename}` : filename
  if (newPath === selectedBlob.value.pathname) {
    moveOpen.value = false
    return
  }
  try {
    const blob = await $fetch<Blob>(`${apiBase.value}/_hub/devtools/blob/${selectedBlob.value.pathname}`)
    const formData = new FormData()
    formData.append('file', blob, filename)
    await $fetch(`${apiBase.value}/_hub/devtools/blob/${newPath}`, { method: 'PUT', body: formData })
    await $fetch(`${apiBase.value}/_hub/devtools/blob/${selectedBlob.value.pathname}`, { method: 'DELETE' })
    toast.add({ title: 'Moved', color: 'success' })
    moveOpen.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Failed to move', color: 'error' })
  }
}

async function confirmRename() {
  if (!selectedBlob.value || !renameName.value) return
  const oldPath = selectedBlob.value.pathname
  const dir = oldPath.split('/').slice(0, -1).join('/')
  const newPath = dir ? `${dir}/${renameName.value}` : renameName.value
  if (newPath === oldPath) {
    renameOpen.value = false
    return
  }
  try {
    const blob = await $fetch<Blob>(`${apiBase.value}/_hub/devtools/blob/${oldPath}`)
    const formData = new FormData()
    formData.append('file', blob, renameName.value)
    await $fetch(`${apiBase.value}/_hub/devtools/blob/${newPath}`, { method: 'PUT', body: formData })
    await $fetch(`${apiBase.value}/_hub/devtools/blob/${oldPath}`, { method: 'DELETE' })
    toast.add({ title: 'Renamed', color: 'success' })
    renameOpen.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Failed to rename', color: 'error' })
  }
}

async function confirmNewFolder() {
  if (!newFolderName.value) return
  const folderPath = `${prefix.value}${newFolderName.value.replace(/\/$/, '')}/.keep`
  try {
    const formData = new FormData()
    formData.append('file', new Blob(['']), '.keep')
    await $fetch(`${apiBase.value}/_hub/devtools/blob/${folderPath}`, { method: 'PUT', body: formData })
    toast.add({ title: 'Folder created', color: 'success' })
    newFolderOpen.value = false
    newFolderName.value = ''
    await refresh()
  } catch {
    toast.add({ title: 'Failed to create folder', color: 'error' })
  }
}

async function uploadFiles(files: FileList | File[]) {
  for (const file of files) {
    const pathname = prefix.value + file.name
    const formData = new FormData()
    formData.append('file', file)
    try {
      await $fetch(`${apiBase.value}/_hub/devtools/blob/${pathname}`, { method: 'PUT', body: formData })
      toast.add({ title: `Uploaded ${file.name}`, color: 'success' })
    } catch {
      toast.add({ title: `Failed to upload ${file.name}`, color: 'error' })
    }
  }
  await refresh()
}

async function handleUpload(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length) return
  await uploadFiles(files)
  if (uploadRef.value) uploadRef.value.value = ''
}

const { isOverDropZone: isDragging } = useDropZone(containerRef, {
  onDrop: (files) => { if (files?.length) uploadFiles(files) }
})

async function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  const files: File[] = []
  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        const ext = file.type.split('/')[1] || 'png'
        const name = `pasted-${Date.now()}.${ext}`
        files.push(new File([file], name, { type: file.type }))
      }
    }
  }
  if (files.length) {
    e.preventDefault()
    await uploadFiles(files)
  }
}

function toggleSelect(item: BlobItem) {
  if (isFolder(item)) return
  const path = item.pathname
  if (selectedItems.value.has(path)) {
    selectedItems.value.delete(path)
  } else {
    selectedItems.value.add(path)
  }
  selectedItems.value = new Set(selectedItems.value)
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedItems.value.clear()
  } else {
    items.value.filter(i => !isFolder(i)).forEach(i => selectedItems.value.add(i.pathname))
  }
  selectedItems.value = new Set(selectedItems.value)
}

async function deleteSelected() {
  const paths = Array.from(selectedItems.value)
  for (const path of paths) {
    try {
      await $fetch(`${apiBase.value}/_hub/devtools/blob/${path}`, { method: 'DELETE' })
    } catch {
      toast.add({ title: `Failed to delete ${path}`, color: 'error' })
    }
  }
  toast.add({ title: `Deleted ${paths.length} files`, color: 'success' })
  await refresh()
}

function downloadSelected() {
  const paths = Array.from(selectedItems.value)
  paths.forEach((path) => {
    const item = items.value.find(i => i.pathname === path)
    if (item && !isFolder(item)) downloadBlob(item)
  })
}

useEventListener(document, 'paste', onPaste)
</script>

<template>
  <div
    ref="containerRef"
    class="relative min-h-[calc(100vh-8rem)]"
  >
    <!-- Drag overlay -->
    <div
      v-if="isDragging"
      class="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center"
    >
      <div class="text-center">
        <UIcon name="i-lucide-upload" class="size-12 text-primary mb-2" />
        <p class="text-lg font-medium">
          Drop files to upload
        </p>
      </div>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between mb-4 gap-4">
      <div class="flex items-center gap-2">
        <UBadge color="neutral" variant="subtle">
          {{ items.filter(i => !isFolder(i)).length }} files
        </UBadge>
        <template v-if="hasSelection">
          <UBadge color="primary" variant="soft">
            {{ selectedItems.size }} selected
          </UBadge>
          <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-download" @click="downloadSelected">
            Download
          </UButton>
          <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="deleteSelected">
            Delete
          </UButton>
        </template>
      </div>
      <div class="flex gap-2">
        <UButton icon="i-lucide-rotate-cw" color="neutral" variant="ghost" :loading @click="refresh" />
        <UButton icon="i-lucide-folder-plus" color="neutral" variant="soft" @click="newFolderOpen = true">
          New Folder
        </UButton>
        <UButton icon="i-lucide-upload" @click="uploadRef?.click()">
          Upload
        </UButton>
        <input ref="uploadRef" type="file" multiple class="hidden" @change="handleUpload">
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center gap-2 mb-4">
      <UBreadcrumb v-if="prefix" :items="breadcrumbItems" />
      <div class="flex-1" />
      <!-- Search -->
      <UInput v-model="search" placeholder="Filter..." icon="i-lucide-search" size="sm" class="w-48" />
      <!-- Sort -->
      <USelect v-model="sortBy" :items="sortOptions" size="sm" class="w-32" />
      <!-- View toggle -->
      <div class="flex border border-default rounded-md">
        <UButton
          size="xs"
          :color="viewMode === 'table' ? 'primary' : 'neutral'"
          :variant="viewMode === 'table' ? 'soft' : 'ghost'"
          icon="i-lucide-list"
          class="rounded-r-none"
          @click="viewMode = 'table'"
        />
        <UButton
          size="xs"
          :color="viewMode === 'grid' ? 'primary' : 'neutral'"
          :variant="viewMode === 'grid' ? 'soft' : 'ghost'"
          icon="i-lucide-grid-2x2"
          class="rounded-l-none"
          @click="viewMode = 'grid'"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-2">
      <USkeleton v-for="n in 5" :key="n" class="h-12 w-full" />
    </div>

    <!-- Empty State -->
    <UEmpty v-else-if="!filteredItems.length" icon="i-lucide-hard-drive" title="No files found" description="Upload files or create a folder to get started">
      <template #actions>
        <UButton @click="uploadRef?.click()">
          Upload File
        </UButton>
      </template>
    </UEmpty>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-4 gap-4">
      <UContextMenu v-for="item in filteredItems" :key="item.pathname" :items="contextMenuItems(item)">
        <div
          class="relative group border border-default rounded-lg p-3 hover:bg-accented cursor-pointer transition-colors"
          :class="{ 'ring-2 ring-primary': selectedItems.has(item.pathname) }"
          @click="isFolder(item) ? openFolder(item) : openPreview(item)"
        >
          <!-- Checkbox -->
          <div v-if="!isFolder(item)" class="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
            <UCheckbox :model-value="selectedItems.has(item.pathname)" @update:model-value="toggleSelect(item)" />
          </div>
          <!-- Thumbnail or icon -->
          <div class="aspect-square mb-2 rounded-md bg-elevated flex items-center justify-center overflow-hidden">
            <img v-if="!isFolder(item) && getThumbnailUrl(item)" :src="getThumbnailUrl(item)!" class="w-full h-full object-cover" :alt="item.pathname">
            <UIcon v-else :name="getIcon(item)" class="size-10 text-muted" />
          </div>
          <!-- Name -->
          <p class="text-sm font-medium text-highlighted truncate">
            {{ item.pathname.replace(prefix, '').replace(/\/$/, '') }}
          </p>
          <p v-if="!isFolder(item)" class="text-xs text-muted">
            {{ formatSize(item.size) }}
          </p>
        </div>
      </UContextMenu>
    </div>

    <!-- Table View -->
    <div v-else class="border border-default rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-elevated border-b border-default">
          <tr>
            <th class="w-10 px-2 py-3">
              <UCheckbox :model-value="allSelected" :indeterminate="hasSelection && !allSelected" @update:model-value="toggleSelectAll" />
            </th>
            <th class="text-left px-4 py-3 font-medium text-muted">
              Name
            </th>
            <th class="text-left px-4 py-3 font-medium text-muted w-24">
              Size
            </th>
            <th class="text-left px-4 py-3 font-medium text-muted w-36">
              Modified
            </th>
            <th class="w-20" />
          </tr>
        </thead>
        <tbody>
          <UContextMenu v-for="item in filteredItems" :key="item.pathname" :items="contextMenuItems(item)">
            <tr
              class="border-t border-default hover:bg-accented cursor-pointer transition-colors"
              :class="{ 'bg-primary/5': selectedItems.has(item.pathname) }"
              @click="isFolder(item) ? openFolder(item) : openPreview(item)"
            >
              <td class="px-2 py-2.5" @click.stop>
                <UCheckbox v-if="!isFolder(item)" :model-value="selectedItems.has(item.pathname)" @update:model-value="toggleSelect(item)" />
              </td>
              <td class="px-4 py-2.5">
                <div class="flex items-center gap-2">
                  <UIcon :name="getIcon(item)" class="size-4 text-muted" />
                  <span class="font-medium text-highlighted">{{ item.pathname.replace(prefix, '').replace(/\/$/, '') }}</span>
                </div>
              </td>
              <td class="px-4 py-2.5 text-muted">
                {{ isFolder(item) ? '-' : formatSize(item.size) }}
              </td>
              <td class="px-4 py-2.5 text-muted whitespace-nowrap">
                <template v-if="isFolder(item)">
                  -
                </template>
                <NuxtTime v-else :datetime="item.uploadedAt" month="short" day="numeric" hour="2-digit" minute="2-digit" />
              </td>
              <td class="px-2 py-2.5">
                <div v-if="!isFolder(item)" class="flex gap-0.5 justify-end" @click.stop>
                  <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-download" @click="downloadBlob(item)" />
                  <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="openDelete(item)" />
                </div>
              </td>
            </tr>
          </UContextMenu>
        </tbody>
      </table>
    </div>

    <!-- Preview Modal -->
    <UModal v-model:open="previewOpen" :title="selectedBlob?.pathname.split('/').pop()" :transition="false" class="sm:max-w-2xl">
      <template #body>
        <div v-if="selectedBlob" class="space-y-4">
          <div class="flex gap-4 text-sm text-muted">
            <span>{{ selectedBlob.contentType }}</span>
            <span>{{ formatSize(selectedBlob.size) }}</span>
            <NuxtTime :datetime="selectedBlob.uploadedAt" month="short" day="numeric" hour="2-digit" minute="2-digit" />
          </div>
          <img v-if="selectedBlob.contentType.startsWith('image/')" :src="previewUrl" class="max-w-full max-h-96 rounded-lg" alt="Preview">
          <video v-else-if="selectedBlob.contentType.startsWith('video/')" :src="previewUrl" controls class="max-w-full max-h-96 rounded-lg" />
          <audio v-else-if="selectedBlob.contentType.startsWith('audio/')" :src="previewUrl" controls class="w-full" />
          <div v-else class="text-muted text-sm">
            Preview not available for this file type
          </div>
        </div>
      </template>
      <template #footer>
        <UButton color="neutral" variant="ghost" @click="previewOpen = false">
          Close
        </UButton>
        <UButton v-if="selectedBlob" @click="downloadBlob(selectedBlob)">
          Download
        </UButton>
      </template>
    </UModal>

    <!-- Delete Modal -->
    <UModal v-model:open="deleteOpen" title="Delete File?" :transition="false">
      <template #body>
        <p class="text-muted">
          Are you sure you want to delete <code class="font-mono bg-elevated px-1.5 py-0.5 rounded text-sm text-highlighted">{{ selectedBlob?.pathname }}</code>?
        </p>
      </template>
      <template #footer>
        <UButton color="neutral" variant="ghost" @click="deleteOpen = false">
          Cancel
        </UButton>
        <UButton color="error" @click="confirmDelete">
          Delete
        </UButton>
      </template>
    </UModal>

    <!-- New Folder Modal -->
    <UModal v-model:open="newFolderOpen" title="New Folder" :transition="false">
      <template #body>
        <UFormField label="Folder name" required>
          <UInput v-model="newFolderName" placeholder="my-folder" autofocus @keyup.enter="confirmNewFolder" />
        </UFormField>
      </template>
      <template #footer>
        <UButton color="neutral" variant="ghost" @click="newFolderOpen = false">
          Cancel
        </UButton>
        <UButton :disabled="!newFolderName" @click="confirmNewFolder">
          Create
        </UButton>
      </template>
    </UModal>

    <!-- Move Modal -->
    <UModal v-model:open="moveOpen" title="Move File" :transition="false">
      <template #body>
        <UFormField label="Destination path" description="Leave empty for root">
          <UInput v-model="movePath" placeholder="folder/subfolder/" @keyup.enter="confirmMove" />
        </UFormField>
      </template>
      <template #footer>
        <UButton color="neutral" variant="ghost" @click="moveOpen = false">
          Cancel
        </UButton>
        <UButton @click="confirmMove">
          Move
        </UButton>
      </template>
    </UModal>

    <!-- Rename Modal -->
    <UModal v-model:open="renameOpen" title="Rename File" :transition="false">
      <template #body>
        <UFormField label="New name" required>
          <UInput v-model="renameName" autofocus @keyup.enter="confirmRename" />
        </UFormField>
      </template>
      <template #footer>
        <UButton color="neutral" variant="ghost" @click="renameOpen = false">
          Cancel
        </UButton>
        <UButton :disabled="!renameName" @click="confirmRename">
          Rename
        </UButton>
      </template>
    </UModal>
  </div>
</template>
