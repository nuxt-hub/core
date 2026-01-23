<script setup lang="ts">
import { ref, computed, h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useToast } from '@nuxt/ui/runtime/composables/useToast'
import { AlertDialogRoot, AlertDialogPortal, AlertDialogOverlay, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from 'reka-ui'
import { useApiBase } from '~/composables/useApiBase'

interface KVItem { key: string, value: unknown }

const toast = useToast()
const apiBase = useApiBase()
const search = ref('')
const editOpen = ref(false)
const addOpen = ref(false)
const deleteOpen = ref(false)
const clearOpen = ref(false)
const selectedItem = ref<KVItem | null>(null)
const newKey = ref('')
const newValue = ref('')
const newTtl = ref<number | undefined>()
const editValue = ref('')

const { data, status, refresh } = await useFetch<KVItem[]>(
  () => `${apiBase.value}/_hub/devtools/kv`,
  { onResponseError: () => toast.add({ title: 'Failed to fetch keys', color: 'error' }) }
)

const loading = computed(() => status.value === 'pending')
const items = computed(() => data.value ?? [])

const filteredItems = computed(() => {
  if (!search.value) return items.value
  return items.value.filter(i => i.key.toLowerCase().includes(search.value.toLowerCase()))
})

function formatValue(val: unknown): string {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'object') {
    const str = JSON.stringify(val)
    return str.length > 50 ? str.slice(0, 50) + '...' : str
  }
  const str = String(val)
  return str.length > 50 ? str.slice(0, 50) + '...' : str
}

const columns: TableColumn<KVItem>[] = [
  { accessorKey: 'key', header: 'Key', meta: { class: { td: 'font-mono text-sm text-highlighted font-medium w-1/3' } } },
  { accessorKey: 'value', header: 'Value', cell: ({ row }) => formatValue(row.original.value), meta: { class: { td: 'font-mono text-xs text-muted' } } },
  {
    id: 'actions',
    cell: ({ row }) => {
      const UButton = resolveComponent('UButton')
      return h('div', { class: 'flex gap-0.5 justify-end', onClick: (e: Event) => e.stopPropagation() }, [
        h(UButton, { size: 'xs', color: 'neutral', variant: 'ghost', icon: 'i-lucide-pencil', onClick: () => openEdit(row.original) }),
        h(UButton, { size: 'xs', color: 'error', variant: 'ghost', icon: 'i-lucide-trash-2', onClick: () => openDelete(row.original) })
      ])
    }
  }
]

function openEdit(item: KVItem) {
  selectedItem.value = item
  editValue.value = typeof item.value === 'object' ? JSON.stringify(item.value, null, 2) : String(item.value)
  editOpen.value = true
}

function openDelete(item: KVItem) {
  selectedItem.value = item
  deleteOpen.value = true
}

function openAdd() {
  newKey.value = ''
  newValue.value = ''
  newTtl.value = undefined
  addOpen.value = true
}

async function saveEdit() {
  if (!selectedItem.value) return
  try {
    let value: unknown = editValue.value
    try {
      value = JSON.parse(editValue.value)
    } catch {
      // Keep as string if not valid JSON
    }
    await $fetch(`${apiBase.value}/_hub/devtools/kv/${encodeURIComponent(selectedItem.value.key)}`, { method: 'PUT', body: { value } })
    toast.add({ title: 'Updated', color: 'success' })
    editOpen.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Failed to update', color: 'error' })
  }
}

async function confirmDelete() {
  if (!selectedItem.value) return
  try {
    await $fetch(`${apiBase.value}/_hub/devtools/kv/${encodeURIComponent(selectedItem.value.key)}`, { method: 'DELETE' })
    toast.add({ title: 'Deleted', color: 'success' })
    deleteOpen.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Failed to delete', color: 'error' })
  }
}

async function confirmAdd() {
  if (!newKey.value) return
  try {
    let value: unknown = newValue.value
    try {
      value = JSON.parse(newValue.value)
    } catch {
      // Keep as string if not valid JSON
    }
    await $fetch(`${apiBase.value}/_hub/devtools/kv/${encodeURIComponent(newKey.value)}`, { method: 'PUT', body: { value, ttl: newTtl.value } })
    toast.add({ title: 'Added', color: 'success' })
    addOpen.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Failed to add', color: 'error' })
  }
}

async function confirmClear() {
  try {
    await $fetch(`${apiBase.value}/_hub/devtools/kv/clear`, { method: 'POST', body: { confirm: 'CLEAR_ALL' } })
    toast.add({ title: 'Cleared all keys', color: 'success' })
    clearOpen.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Failed to clear', color: 'error' })
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <UBadge
          color="neutral"
          variant="subtle"
        >
          {{ items.length }} keys
        </UBadge>
      </div>
      <div class="flex gap-2">
        <UButton
          icon="i-lucide-rotate-cw"
          color="neutral"
          variant="ghost"
          :loading
          @click="refresh"
        />
        <UButton
          icon="i-lucide-plus"
          @click="openAdd"
        >
          Add Key
        </UButton>
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="soft"
          :disabled="!items.length"
          @click="clearOpen = true"
        >
          Clear All
        </UButton>
      </div>
    </div>

    <!-- Search -->
    <UInput
      v-model="search"
      placeholder="Search keys..."
      icon="i-lucide-search"
      class="mb-4 max-w-xs"
    />

    <!-- Empty State -->
    <UEmpty
      v-if="!loading && !filteredItems.length"
      icon="i-lucide-database"
      title="No keys found"
      description="Add your first key to get started"
    >
      <template #actions>
        <UButton @click="openAdd">
          Add Key
        </UButton>
      </template>
    </UEmpty>

    <!-- Table -->
    <UTable
      v-else
      :data="filteredItems"
      :columns="columns"
      :loading="loading"
      class="border border-default rounded-lg"
      :ui="{ tr: 'cursor-pointer' }"
      @select="(_e, row) => openEdit(row.original)"
    />

    <!-- Edit Modal -->
    <UModal
      v-model:open="editOpen"
      title="Edit Value"
      :description="selectedItem?.key"
      :transition="false"
      class="sm:max-w-xl"
    >
      <template #body>
        <UTextarea
          v-model="editValue"
          :rows="10"
          class="w-full font-mono text-sm"
          autoresize
        />
      </template>
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          @click="editOpen = false"
        >
          Cancel
        </UButton>
        <UButton @click="saveEdit">
          Save
        </UButton>
      </template>
    </UModal>

    <!-- Add Modal -->
    <UModal
      v-model:open="addOpen"
      title="Add New Key"
      :transition="false"
      class="sm:max-w-xl"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            label="Key"
            required
            class="w-full"
          >
            <UInput
              v-model="newKey"
              placeholder="my-key"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Value"
            description="JSON or string"
            class="w-full"
          >
            <UTextarea
              v-model="newValue"
              :rows="5"
              class="w-full font-mono text-sm"
              placeholder="{&quot;foo&quot;: &quot;bar&quot;}"
              autoresize
            />
          </UFormField>
          <UFormField label="TTL (seconds)">
            <UInputNumber
              v-model="newTtl"
              placeholder="3600"
              :min="0"
              class="w-32"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          @click="addOpen = false"
        >
          Cancel
        </UButton>
        <UButton
          :disabled="!newKey"
          @click="confirmAdd"
        >
          Add
        </UButton>
      </template>
    </UModal>

    <!-- Delete AlertDialog -->
    <AlertDialogRoot v-model:open="deleteOpen">
      <AlertDialogPortal>
        <AlertDialogOverlay class="fixed inset-0 bg-black/50 z-50" />
        <AlertDialogContent class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-elevated rounded-lg p-6 max-w-md z-50 shadow-lg">
          <AlertDialogTitle class="text-lg font-semibold text-highlighted">
            Delete Key?
          </AlertDialogTitle>
          <AlertDialogDescription class="text-muted mt-2">
            Are you sure you want to delete <code class="font-mono bg-accented px-1.5 py-0.5 rounded text-sm text-highlighted">{{ selectedItem?.key }}</code>?
          </AlertDialogDescription>
          <div class="flex justify-end gap-2 mt-4">
            <AlertDialogCancel as-child>
              <UButton color="neutral" variant="ghost">
                Cancel
              </UButton>
            </AlertDialogCancel>
            <AlertDialogAction as-child>
              <UButton color="error" @click="confirmDelete">
                Delete
              </UButton>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>

    <!-- Clear All AlertDialog -->
    <AlertDialogRoot v-model:open="clearOpen">
      <AlertDialogPortal>
        <AlertDialogOverlay class="fixed inset-0 bg-black/50 z-50" />
        <AlertDialogContent class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-elevated rounded-lg p-6 max-w-md z-50 shadow-lg">
          <AlertDialogTitle class="text-lg font-semibold text-highlighted">
            Clear All Keys?
          </AlertDialogTitle>
          <AlertDialogDescription class="text-muted mt-2">
            This will delete <strong class="text-highlighted">ALL {{ items.length }} keys</strong> from KV storage. This action cannot be undone.
          </AlertDialogDescription>
          <div class="flex justify-end gap-2 mt-4">
            <AlertDialogCancel as-child>
              <UButton color="neutral" variant="ghost">
                Cancel
              </UButton>
            </AlertDialogCancel>
            <AlertDialogAction as-child>
              <UButton color="error" @click="confirmClear">
                Clear All
              </UButton>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>
  </div>
</template>
