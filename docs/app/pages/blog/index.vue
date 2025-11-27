<script setup lang="ts">
const page = {
  title: 'The NuxtHub Blog',
  navigation: {
    title: 'Blog'
  },
  description: 'Read the latest news about NuxtHub or articles about fullstack development with Nuxt.',
  icon: 'i-lucide-newspaper',
  hero: {
    title: 'Blog',
    description: 'Read the latest news about NuxtHub.',
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
        label: 'Blog RSS',
        icon: 'i-simple-icons-rss',
        to: '/blog/rss.xml',
        color: 'neutral',
        variant: 'outline',
        size: 'sm',
        target: '_blank'
      }
    ]
  }

}

const { data: posts } = await useAsyncData('posts', async () => {
  return queryCollection('blog')
    .where('extension', '=', 'md')
    .select('title', 'date', 'image', 'description', 'path', 'authors', 'category')
    .order('date', 'DESC')
    .all()
})

useHead({
  link: [
    { rel: 'alternate', type: 'application/rss+xml', title: 'NuxtHub Blog', href: '/blog/feed.xml' }
  ]
})
useSeoMeta({
  titleTemplate: '%s',
  title: page.title,
  description: page.description,
  ogDescription: page.description,
  ogTitle: `${page.title} · NuxtHub`
})
import.meta.server && defineOgImageComponent('Docs', {
  title: 'Blog'
})
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page?.hero">
      <template #description>
        {{ page.description }}
      </template>
    </UPageHero>
    <UBlogPosts orientation="vertical" class="mb-12">
      <UBlogPost
        v-for="post in posts"
        :key="post.path"
        :to="post.path"
        :title="post.title"
        :description="post.description"
        :image="{ src: post.image, width: 592, height: 333, placeholder: [59, 33, 50, 4], format: 'webp' }"
        :date="formatDateByLocale('en', post.date)"
        :authors="post.authors"
        :badge="{ label: post.category, color: 'neutral', variant: 'subtle' }"
        orientation="horizontal"
      />
    </UBlogPosts>
  </UContainer>
</template>
