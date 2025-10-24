<script setup lang="ts">
// @ts-expect-error yaml is not typed
import page from './.changelog.yml'

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
