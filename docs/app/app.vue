<script setup lang="ts">
const { seo } = useAppConfig()

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
      id="nuxtlabs-joins-vercel"
      title="NuxtLabs is joining Vercel"
      icon="i-simple-icons-vercel"
      to="https://nuxtlabs.com/?utm_source=nuxthub&utm_medium=banner&utm_campaign=nuxtlabs-vercel"
      close
      :actions="[
        {
          label: 'Read the announcement',
          color: 'neutral',
          variant: 'outline',
          trailingIcon: 'i-lucide-arrow-right',
          to: 'https://nuxtlabs.com/?utm_source=nuxthub&utm_medium=banner&utm_campaign=nuxtlabs-vercel'
        }
      ]"
    />

    <AppHeader />
    <UMain class="relative">
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
