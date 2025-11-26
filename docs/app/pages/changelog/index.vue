<script setup lang="ts">
const page = {
  title: 'Changelog',
  description: 'Follow the latest updates and improvements of NuxtHub.',
  icon: 'i-lucide-megaphone',
  hero: {
    title: 'Changelog',
    description: 'Follow the latest updates and improvements of NuxtHub.',
    align: 'center',
    links: [
      {
        label: '@nuxt_hub',
        icon: 'i-simple-icons-x',
        color: 'neutral',
        variant: 'outline',
        size: 'sm',
        to: 'https://x.com/nuxt_hub',
        target: '_blank'
      },
      {
        label: 'NuxtHub',
        icon: 'i-simple-icons-linkedin',
        color: 'neutral',
        variant: 'outline',
        size: 'sm',
        to: 'https://www.linkedin.com/showcase/nuxthub/',
        target: '_blank'
      },
      {
        label: 'Changelog RSS',
        icon: 'i-simple-icons-rss',
        to: '/changelog/rss.xml',
        color: 'neutral',
        variant: 'outline',
        size: 'sm',
        target: '_blank'
      }
    ]
  }
}

definePageMeta({
  primary: 'green'
})
const { data: versions } = await useAsyncData('versions', async () => {
  return queryCollection('changelog')
    .where('extension', '=', 'md')
    .select('title', 'date', 'image', 'description', 'path', 'authors')
    .order('date', 'DESC')
    .all()
})

useHead({
  link: [
    { rel: 'alternate', type: 'application/rss+xml', title: 'NuxtHub Changelog', href: '/changelog/feed.xml' }
  ]
})
useSeoMeta({
  title: page.title,
  ogTitle: `${page.title} · NuxtHub`,
  description: page.description,
  ogDescription: page.description
})

defineOgImageComponent('Docs')
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page.hero" />
    <UChangelogVersions v-if="versions.length">
      <UChangelogVersion
        v-for="(version, index) in versions"
        :key="index"
        v-bind="version"
        :to="version.path"
      />
    </UChangelogVersions>
    <UEmpty
      v-else
      title="No versions found"
      description="Upcoming changelog versions will be listed here."
      icon="i-lucide-megaphone"
    />
  </UContainer>
</template>
