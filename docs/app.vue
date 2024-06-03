<script setup lang="ts">
import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

const appConfig = useAppConfig()
const route = useRoute()
const { seo } = useAppConfig()
const { isLoading } = useLoadingIndicator()

const primary = (route.meta?.primary as string) || 'green'
appConfig.ui.primary = primary
watch(() => route.meta?.primary, (primary: string) => {
  setTimeout(() => {
    appConfig.ui.primary = primary || 'green'
  }, 40)
})
const heroBackgroundClass = computed(() => route.meta?.heroBackground || '')

const appear = ref(false)
const appeared = ref(false)
const { data: navigation } = await useAsyncData('navigation', () => fetchContentNavigation(), {
  default: () => []
})
const { data: files } = useLazyFetch<ParsedContent[]>('/api/search.json', {
  default: () => [],
  server: false
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  ogSiteName: seo?.siteName,
  twitterCard: 'summary_large_image',
  titleTemplate(title) {
    return title.includes('NuxtHub') ? title : `${title} · NuxtHub`
  }
})

provide('navigation', navigation)

onMounted(() => {
  setTimeout(() => {
    appear.value = true
    setTimeout(() => {
      appeared.value = true
    }, 1000)
  }, 0)
})

const links = [{
  label: 'NuxtHub Admin',
  to: 'https://admin.hub.nuxt.com',
  target: '_blank',
  icon: 'i-simple-icons-nuxtdotjs'
}, {
  label: 'NuxtHub repository',
  to: 'https://github.com/nuxt-hub/core',
  target: '_blank',
  icon: 'i-simple-icons-github'
}, {
  label: 'NuxtHub on X',
  to: 'https://x.com/nuxt_hub',
  target: '_blank',
  icon: 'i-simple-icons-x'
}]
</script>

<template>
  <div class="bg-white dark:bg-gray-950">
    <AppHeader />
    <UMain class="relative">
      <HeroBackground
        class="absolute w-full top-[1px] transition-all text-primary flex-shrink-0"
        :class="[
          isLoading ? 'animate-pulse' : (appear ? 'opacity-100' : 'opacity-0'),
          appeared ? 'duration-[400ms]': 'duration-1000',
          heroBackgroundClass
        ]"
      />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <AppFooter />

    <ClientOnly>
      <LazyUContentSearch :files="files" :navigation="navigation" :links="links" />
    </ClientOnly>

    <UNotifications />
  </div>
</template>
