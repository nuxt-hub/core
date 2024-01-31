<script setup>
const form = ref(null)

async function upload() {
  await $fetch('/api/storage/upload', {
    method: 'POST',
    body: new FormData(form.value)
  })
  // form.value.reset()
}
</script>

<template>
  <form ref="form" @submit.prevent="upload">
    <input type="file" name="file" class="inline-block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 dark:file:bg-gray-700 dark:file:text-gray-200 hover:file:bg-gray-300 dark:hover:file:bg-gray-600">
    <UButton type="submit">
      Upload
    </UButton>
  </form>
</template>
