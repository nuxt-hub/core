<script setup lang="ts">
import mediumZoom from 'medium-zoom'
import { withoutTrailingSlash } from 'ufo'

definePageMeta({
  layout: 'docs',
  primary: 'green',
  heroBackground: 'opacity-30'
})

const route = useRoute()
const { toc, seo } = useAppConfig()

const { data: page } = await useAsyncData(() => queryContent(route.path).findOne())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: surround } = await useAsyncData(() => queryContent()
  .where({ _extension: 'md', navigation: { $ne: false }, _path: { $regex: /^\/docs/ } })
  .only(['title', 'description', '_path'])
  .findSurround(withoutTrailingSlash(route.path))
)

useSeoMeta({
  titleTemplate: `%s · ${seo?.siteName}`,
  title: page.value.title,
  ogTitle: `${page.value.title} · ${seo?.siteName}`,
  description: page.value.description,
  ogDescription: page.value.description
})

defineOgImageComponent('Docs', {
  category: 'Docs'
})

// const headline = computed(() => findPageHeadline(page.value))

onMounted(() => {
  mediumZoom('[data-zoom-src]', {
    margin: 5
  })
})
</script>

<template>
  <UPage>
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
      <UDivider class="my-10">
        <div class="flex items-center gap-2 text-sm dark:text-gray-400">
          <UButton size="sm" variant="link" color="gray" to="https://github.com/nuxt-hub/core/issues/new/choose" target="_blank">
            Report an issue
          </UButton>
          or
          <UButton size="sm" variant="link" color="gray" :to="`${toc.bottom.edit}/${page?._file}`" target="_blank">
            Edit this page on GitHub
          </UButton>
        </div>
      </UDivider>
      <UContentSurround :surround="surround" />
    </div>

    <template v-if="page.toc !== false" #right>
      <UContentToc :title="toc?.title" :links="page.body?.toc?.links" class="bg-transparent dark:bg-transparent backdrop-blur-none" />
    </template>
  </UPage>
</template>
