<script setup>
const url = ref('https://hub.nuxt.com')
const image = ref('')
const theme = ref('light')
const loading = ref(false)
const framework = ref('')
const toast = useToast()

const capture = async () => {
  if (loading.value) return
  loading.value = true
  await $fetch.raw('/api/browser/capture', {
    query: {
      url: url.value,
      theme: theme.value
    }
  })
    .then(async (res) => {
      image.value = URL.createObjectURL(res._data)
      framework.value = res.headers.get('x-framework')
    })
    .catch((err) => {
      toast.add({
        title: 'Error',
        description: err.data?.message || err.message,
        color: 'red'
      })
    })
  loading.value = false
}
</script>

<template>
  <UCard @submit.prevent="capture">
    <template #header>
      <div class="flex lg:flex-row flex-col items-center gap-2">
        <UInput v-model="url" type="url" class="w-full flex-1" placeholder="https://hub.nuxt.com" />
        <USelect v-model="theme" :options="['light', 'dark']" />
        <UButton type="submit" icon="i-lucide-camera" size="sm" :loading="loading">
          Capture
        </UButton>
      </div>
    </template>
    <UAlert v-if="!image" :title="loading ? 'Capturing...' : 'No screenshot captured'" color="white" icon="i-lucide-info" />
    <img v-if="image" :src="image" class="rounded border dark:border-gray-800" style="aspect-ratio: 16/9;" :class="{ 'animate-pulse': loading }">
    <UAlert v-if="framework" class="mt-4" :class="{ 'animate-pulse': loading }" :title="`This website is made with ${framework}`" color="white" icon="i-lucide-code-xml" />
    <p class="mt-4">
      Or open our <UButtonGroup>
        <UButton to="/invoice.pdf" external color="gray">
          PDF invoice
        </UButton>
        <UButton to="/invoice.pdf" external download color="gray" icon="i-lucide-download" />
      </UButtonGroup>
    </p>
  </UCard>
</template>
