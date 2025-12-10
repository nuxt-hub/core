<script setup lang="ts">
const route = useRoute()
const { data: page } = await useAsyncData(() => route.path.replace(/\//g, '-'), () => {
  return queryCollection('pages').path(route.path).first()
})

if (!page.value) {
  throw createError({ statusMessage: 'Page not found', statusCode: 404 })
}

useSeoMeta(page.value.seo)
</script>

<template>
  <ContentRenderer v-if="page" :value="page" />
</template>
