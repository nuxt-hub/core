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

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'), {
  transform: data => data.find(item => item.path === '/docs')?.children || []
})
const { data: files } = useLazyAsyncData('search', () => queryCollectionSearchSections('docs'), {
  server: false
})

const links = computed(() => [
  ...navigation.value.map(item => ({
    label: item.title,
    icon: item.icon,
    to: item.path === '/docs' ? '/docs/getting-started' : item.path
  })),
  {
    label: 'NuxtHub Admin',
    to: 'https://admin.hub.nuxt.com',
    target: '_blank',
    icon: 'i-simple-icons-nuxtdotjs'
  }, {
    label: 'nuxt-hub/core',
    to: 'https://github.com/nuxt-hub/core',
    target: '_blank',
    icon: 'i-simple-icons-github'
  }, {
    label: '@nuxt_hub',
    to: 'https://x.com/nuxt_hub',
    target: '_blank',
    icon: 'i-simple-icons-x'
  }, {
    label: 'NuxtHub',
    to: 'https://www.linkedin.com/showcase/nuxthub/',
    target: '_blank',
    icon: 'i-simple-icons-linkedin'
  }]
)
</script>

<template>
  <UApp>
    <!-- <AppHeader /> -->
    <UError :error="error" />

    <!-- <AppFooter /> -->

    <ClientOnly>
      <LazyUContentSearch :files="files" :navigation="navigation" :links="links" />
    </ClientOnly>
  </UApp>
</template>
