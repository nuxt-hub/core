<script setup lang="ts">
const appConfig = useAppConfig()
const route = useRoute()
const { seo } = useAppConfig()
const { isLoading } = useLoadingIndicator()

const primary = (route.meta?.primary as string) || 'green'
appConfig.ui.colors.primary = primary
watch(() => route.meta?.primary, (primary: string) => {
  setTimeout(() => {
    appConfig.ui.colors.primary = primary || 'green'
  }, 40)
})
const heroBackgroundClass = computed(() => route.meta?.heroBackground || '')

const appear = ref(false)
const appeared = ref(false)

const { data: navigation } = await useAsyncData('navigation', () => {
  return Promise.all([
    queryCollectionNavigation('docs'),
    queryCollectionNavigation('blog'),
    queryCollectionNavigation('changelog')
  ])
}, {
  transform: data => data.flat()
})
const { data: files } = useLazyAsyncData('search', () => {
  return Promise.all([
    queryCollectionSearchSections('docs'),
    queryCollectionSearchSections('blog'),
    queryCollectionSearchSections('changelog')
  ])
}, {
  server: false,
  transform: data => data.flat()
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
    return title?.includes('NuxtHub') ? title : `${title} · NuxtHub`
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
    <AppHeader />
    <UMain class="relative">
      <HeroBackground
        class="absolute w-full -top-px transition-all text-(--ui-primary) shrink-0 -z-10"
        :class="[
          isLoading ? 'animate-pulse' : (appear ? heroBackgroundClass : 'opacity-0'),
          appeared ? 'duration-[400ms]' : 'duration-1000'
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
  </UApp>
</template>
