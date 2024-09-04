<script setup>
const loading = ref(false)
const newEntryKey = ref('')
const newEntryValue = ref('')
const newEntryKeyInput = ref(null)
const editedEntryKey = ref(null)
const editedEntryValue = ref(null)

const toast = useToast()
const { data: entries } = await useFetch('/api/kv')

async function addEntry() {
  const key = newEntryKey.value.trim().replace(/\s/g, '-')
  const value = newEntryValue.value.trim()
  if (!key || !value) return

  loading.value = true

  try {
    const entry = await $fetch('/api/kv', {
      method: 'PUT',
      body: {
        key,
        value
      }
    })
    const entryIndex = entries.value.findIndex(e => e.key === entry.key)
    if (entryIndex !== -1) {
      entries.value.splice(entryIndex, 1, entry)
    } else {
      entries.value.push(entry)
    }
    toast.add({ title: `Entry "${entry.key}" created.` })
    newEntryKey.value = ''
    newEntryValue.value = ''
    nextTick(() => {
      newEntryKeyInput.value?.input?.focus()
    })
  } catch (err) {
    const title = err.data?.data?.issues?.map(issue => issue.message).join('\n') || err.message
    toast.add({ title, color: 'red' })
  }
  loading.value = false
}

function editEntry(entry) {
  editedEntryValue.value = entry.value
  editedEntryKey.value = entry.key
}

async function updateEntry() {
  const entry = await $fetch('/api/kv', {
    method: 'PUT',
    body: {
      key: editedEntryKey.value,
      value: editedEntryValue.value.trim()
    }
  })
  const entryIndex = entries.value.findIndex(e => e.key === entry.key)
  if (entryIndex !== -1) {
    entries.value.splice(entryIndex, 1, entry)
  } else {
    entries.value.push(entry)
  }
  editedEntryKey.value = null
  editedEntryValue.value = null
}

async function deleteEntry(entry) {
  await $fetch(`/api/kv/${entry.key}`, { method: 'DELETE' })
  entries.value = entries.value.filter(t => t.key !== entry.key)
  toast.add({ title: `Entry "${entry.key}" deleted.` })
}
</script>

<template>
  <UCard @submit.prevent="addEntry">
    <div class="flex items-center gap-2">
      <UInput
        ref="newEntryKeyInput"
        v-model="newEntryKey"
        name="entryKey"
        :disabled="loading"
        class="flex-1"
        placeholder="key"
        autocomplete="off"
        autofocus
        :ui="{ wrapper: 'flex-1' }"
      />

      <UInput
        v-model="newEntryValue"
        name="entryValue"
        :disabled="loading"
        class="flex-1"
        placeholder="value"
        autocomplete="off"
        :ui="{ wrapper: 'flex-1' }"
      />

      <UButton type="submit" icon="i-heroicons-plus-20-solid" :loading="loading" :disabled="newEntryKey.trim().length === 0" />
    </div>

    <ul v-if="entries?.length" class="divide-y divide-gray-200 dark:divide-gray-800 mt-4">
      <li
        v-for="entry of entries"
        :key="entry.key"
        class="flex items-center gap-4 py-2"
      >
        <span class="flex-1 font-medium">{{ entry.key }}</span>

        <div class="flex-1 flex items-center">
          <span v-if="editedEntryKey !== entry.key" class="flex-1 font-medium">{{ entry.value }}</span>
          <UInput
            v-else
            v-model="editedEntryValue"
            name="editedValue"
            variant="none"
            size="xl"
            autofocus
            :padded="false"
            class="flex-1"
            @keydown.enter="updateEntry(entry)"
            @keydown.esc="editedEntryKey = null"
          />

          <UButton
            v-if="editedEntryKey !== entry.key"
            variant="ghost"
            size="2xs"
            icon="i-heroicons-pencil"
            class="flex-shrink-0"
            @click="editEntry(entry)"
          />
          <div v-else class="flex-shrink-0 flex gap-1">
            <UButton
              variant="ghost"
              size="2xs"
              icon="i-heroicons-check"
              @click="updateEntry(entry)"
            />
            <UButton
              variant="ghost"
              size="2xs"
              icon="i-heroicons-x-mark"
              @click="editedEntryKey = null"
            />
          </div>
        </div>

        <UButton
          color="red"
          variant="soft"
          size="2xs"
          icon="i-heroicons-x-mark-20-solid"
          class="flex-shrink-0"
          @click="deleteEntry(entry)"
        />
      </li>
    </ul>
  </UCard>
</template>
