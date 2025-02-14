<script setup lang="ts">
import page from '.blog.yml'

const { data: posts } = await useAsyncData('posts', async () => {
  return queryCollection('blog')
    .select('title', 'date', 'image', 'description', 'path', 'authors', 'category')
    .order('date', 'DESC')
    .all()
})

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description

useHead({
  link: [
    { rel: 'alternate', type: 'application/rss+xml', title: 'NuxtHub Blog', href: '/blog/feed.xml' }
  ]
})
useSeoMeta({
  titleTemplate: '%s',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · NuxtHub`
})
defineOgImageComponent('Docs', {
  title: 'Blog'
})
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page?.hero" :ui="{ base: 'z-10' }">
      <template #description>
        {{ page.description }}
      </template>
    </UPageHero>
    <UPage>
      <UPageBody>
        <UBlogList orientation="vertical">
          <UBlogPost
            v-for="post in posts"
            :key="post.path"
            :to="post.path"
            :title="post.title"
            :description="post.description"
            :image="{ src: post.image, width: 592, height: 333, placeholder: [59, 33, 50, 4], format: 'webp' }"
            :date="formatDateByLocale('en', post.date)"
            :authors="post.authors"
            :badge="{ label: post.category, color: 'neutral', variant: 'solid' }"
            orientation="horizontal"
          />
        </UBlogList>
      </upagebody>
    </UPage>
  </UContainer>
</template>
