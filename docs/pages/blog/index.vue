<script setup lang="ts">
import type { BlogPost } from '~/types'

const { data: page } = await useAsyncData('blog', () => queryContent('/blog').findOne())
const { data: posts } = await useAsyncData('posts', async () => {
  const posts = await queryContent<BlogPost>('/blog')
    .where({ _extension: 'md' })
    .without(['body', 'excerpt'])
    .sort({ date: -1 })
    .find()

  return posts.filter(article => article._path !== '/blog')
})

const title = page.value.head?.title || page.value.title
const description = page.value.head?.description || page.value.description

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
    <UPageHero v-bind="page?.hero">
      <template #description>
        {{ page.description }}
      </template>
    </UPageHero>
    <UPage>
      <UPageBody>
        <UBlogList orientation="vertical">
          <UBlogPost
            v-for="post in posts"
            :key="post._path"
            :to="post._path"
            :title="post.title"
            :description="post.description"
            :image="{ src: post.image, width: 592, height: 333, placeholder: [59, 33, 50, 4], format: 'webp' }"
            :date="formatDateByLocale('en', post.date)"
            :authors="post.authors"
            :badge="{ label: post.category, color: 'gray', variant: 'solid' }"
            orientation="horizontal"
          />
        </UBlogList>
      </upagebody>
    </UPage>
  </UContainer>
</template>
