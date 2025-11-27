<script setup lang="ts">
definePageMeta({
  layout: 'docs'
})

const route = useRoute()
const { toc, seo } = useAppConfig()

const { data: page } = await useAsyncData(route.path, () => queryCollection('docs').path(route.path).first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => {
  return queryCollectionItemSurroundings('docs', route.path, {
    fields: ['description']
  })
})

useSeoMeta({
  titleTemplate: `%s · ${seo?.siteName}`,
  title: page.value.seo.title,
  ogTitle: `${page.value.seo.title} · ${seo?.siteName}`,
  description: page.value.seo.description,
  ogDescription: page.value.seo.description
})

import.meta.server && defineOgImageComponent('Docs', {
  category: 'Docs'
})
</script>

<template>
  <UPage v-if="page">
    <UPageHeader
      :ui="{ wrapper: 'lg:mr-10' }"
      :title="page.title"
      :description="page.description"
      :links="page.links"
    />

    <UPageBody prose class="dark:text-gray-300 dark:prose-pre:!bg-gray-800/60 lg:pr-10 pb-0">
      <ContentRenderer v-if="page.body" :value="page" />
    </UPageBody>
    <div class="pb-24">
      <USeparator class="my-10">
        <div class="flex items-center gap-2 text-sm dark:text-gray-400">
          <UButton size="sm" variant="link" color="neutral" to="https://github.com/nuxt-hub/core/issues/new/choose" target="_blank">
            Report an issue
          </UButton>
          or
          <UButton size="sm" variant="link" color="neutral" :to="`${toc.bottom.edit}/${page?.stem}.${page?.extension}`" target="_blank">
            Edit this page on GitHub
          </UButton>
        </div>
      </USeparator>
      <UContentSurround :surround="surround" />
    </div>

    <template v-if="page.body?.toc" #right>
      <UContentToc :title="toc?.title" :links="page.body?.toc?.links" highlight class="backdrop-blur-none" />
    </template>
  </UPage>
</template>
