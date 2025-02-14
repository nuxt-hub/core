<script setup lang="ts">
import type { NuxtError } from '#app'

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

defineProps({
  error: {
    type: Object as PropType<NuxtError>,
    required: true
  }
})
useHead({
  htmlAttrs: {
    lang: 'en'
  }
})

// const { data: navigation } = await useAsyncData('navigation', () => fetchContentNavigation())
// const { data: files } = useLazyFetch<ParsedContent[]>('/api/search.json', {
//   default: () => [],
//   server: false
// })

// provide('navigation', navigation.value?.[0]?.children || [])
</script>

<template>
  <UApp>
    <!-- <AppHeader /> -->
    <UError :error="error" />

    <!-- <AppFooter /> -->

    <!-- <ClientOnly>
      <LazyUContentSearch :files="files" :navigation="navigation" />
    </ClientOnly> -->
  </UApp>
</template>
