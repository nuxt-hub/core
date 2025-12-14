<script setup lang="ts">
const { seo } = useAppConfig()
const route = useRoute()

const { data: navigation } = await useAsyncData('navigation', () => {
  return Promise.all([
    queryCollectionNavigation('docs'),
    queryCollectionNavigation('changelog')
  ])
}, {
  transform: data => data.flat()
})
const { data: files } = useLazyAsyncData('search', () => {
  return Promise.all([
    queryCollectionSearchSections('docs'),
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

const links = computed(() => [
  ...navigation.value.map(item => ({
    label: item.title,
    icon: item.icon,
    to: item.path === '/docs' ? '/docs/getting-started' : item.path
  })),
  {
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
    <UBanner
      id="nuxthub-multi-vendor"
      title="NuxtHub multi-vendor is now available"
      icon="i-lucide-globe"
      to="/changelog/nuxthub-multi-vendor"
      close
      :actions="[
        {
          label: 'Read the announcement',
          color: 'neutral',
          variant: 'outline',
          trailingIcon: 'i-lucide-arrow-right',
          to: '/changelog/nuxthub-multi-vendor'
        }
      ]"
    />

    <div :class="[route.path.startsWith('/docs/') && 'root']">
      <AppHeader />
      <UMain class="relative">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </UMain>
      <AppFooter />
    </div>

    <ClientOnly>
      <LazyUContentSearch :files="files" :navigation="navigation" :links="links" />
    </ClientOnly>
  </UApp>
</template>

<style>
/* Safelist (do not remove): [&>div]:*:my-0 [&>div]:*:w-full h-64 !px-0 !py-0 !pt-0 !pb-0 !p-0 !justify-start !justify-end !min-h-96 h-136 max-h-[341px] */

@media (min-width: 1024px) {
  .root {
    --ui-header-height: 112px;
  }
}
</style>
