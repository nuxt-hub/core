<script setup lang="ts">
import { withoutTrailingSlash, joinURL } from 'ufo'
import type { ChangelogPost } from '~/types'

definePageMeta({
  primary: 'green',
  heroBackground: 'opacity-20'
})

const route = useRoute()
const { copy } = useCopyToClipboard()
const { url } = useSiteConfig()

const { data: changelog } = await useAsyncData(`changelog-${route.params.slug}`, () => queryContent<ChangelogPost>(route.path).findOne())
if (!changelog.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

const { data: surround } = await useAsyncData(`changelog-${route.params.slug}-surround`, () => queryContent('/changelog')
  .where({ _extension: 'md', navigation: { $ne: false }, _path: { $regex: /^\/changelog/ } })
  .without(['body', 'excerpt'])
  .sort({ date: -1 })
  .findSurround(withoutTrailingSlash(route.path))
)

const title = changelog.value.head?.title || changelog.value.title
const description = changelog.value.head?.description || changelog.value.description

useSeoMeta({
  titleTemplate: '%s · NuxtHub Changelog',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · NuxtHub Changelog`
})

if (changelog.value.image) {
  defineOgImage({ url: joinURL(url, changelog.value.image) })
}
const socialLinks = computed(() => [{
  icon: 'i-simple-icons-linkedin',
  to: `https://www.linkedin.com/sharing/share-offsite/?url=https://hub.nuxt.com${changelog.value._path}`
}, {
  icon: 'i-simple-icons-x',
  to: `https://x.com/intent/tweet?text=${encodeURIComponent(`NuxtHub: ${changelog.value.title}\n\n`)}https://hub.nuxt.com${changelog.value._path}`
}])

function copyLink() {
  copy(`https://hub.nuxt.com${changelog.value._path}`, { title: 'URL copied to clipboard' })
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :title="changelog.title" :description="changelog.description" :ui="{ headline: 'flex flex-col gap-y-8 items-start' }">
        <template #headline>
          <UBreadcrumb :links="[{ label: 'Changelog', to: '/changelog' }, { label: changelog.title }]" />

          <time class="text-gray-500 dark:text-gray-400">{{ formatDateByLocale('en', changelog.date) }}</time>
        </template>

        <div class="mt-4 flex flex-wrap items-center gap-6">
          <UButton
            v-for="(author, index) in changelog.authors"
            :key="index"
            :to="author.to"
            target="_blank"
            color="neutral"
            variant="ghost"
            class="-my-1.5 -mx-2.5"
          >
            <UAvatar :src="author.avatar?.src" :alt="author.name" />

            <div class="text-left">
              <p class="font-medium">
                {{ author.name }}
              </p>
              <p class="text-gray-500 dark:text-gray-400 leading-4">
                {{ `@${author.username}` }}
              </p>
            </div>
          </UButton>
        </div>
      </UPageHeader>

      <UPage>
        <UPageBody prose class="dark:text-gray-300 dark:prose-pre:!bg-gray-800/60 lg:pr-10">
          <ContentRenderer v-if="changelog && changelog.body" :value="changelog" />
          <PageSectionCTA />
          <div class="flex items-center justify-between mt-12 not-prose">
            <UButton to="/changelog" variant="link" :padded="false" color="gray" icon="i-lucide-arrow-left">
              Back to changelog
            </UButton>
            <div class="flex justify-end items-center gap-1.5">
              Share:
              <UButton icon="i-lucide-link" color="gray" variant="ghost" @click="copyLink" />
              <UButton
                v-for="(link, index) in socialLinks"
                :key="index"
                v-bind="link"
                variant="ghost"
                color="gray"
                target="_blank"
              />
            </div>
          </div>

          <hr v-if="surround?.length">

          <UContentSurround :surround="surround" />
        </UPageBody>

        <template #right>
          <UContentToc v-if="changelog.body && changelog.body.toc" :links="changelog.body.toc.links" title="On this page" />
        </template>
      </UPage>
    </UPage>
  </UContainer>
</template>
