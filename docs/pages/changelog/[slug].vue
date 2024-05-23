<script setup lang="ts">
import { withoutTrailingSlash } from 'ufo'
import type { ChangelogArticle } from '~/types'

const route = useRoute()
const { copy } = useCopyToClipboard()

const { data: changelog } = await useAsyncData(route.path, () => queryContent<ChangelogArticle>(route.path).findOne())
if (!changelog.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => queryContent('/blog')
  .where({ _extension: 'md' })
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
  ogTitle: `${title} ·  NuxtHub Changelog`
})

if (changelog.value.image) {
  defineOgImage({ url: changelog.value.image })
}
const socialLinks = computed(() => [{
  icon: 'i-simple-icons-linkedin',
  to: `https://www.linkedin.com/sharing/share-offsite/?url=https://hub.nuxt.com${changelog.value._path}`
}, {
  icon: 'i-simple-icons-twitter',
  to: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`NuxtHub: ${changelog.value.title}\n\n`)}https://hub.nuxt.com${changelog.value._path}`
}])

function copyLink() {
  copy(`https://hub.nuxt.com${changelog.value._path}`, { title: 'URL copied to clipboard' })
}
const links = [
  {
    icon: 'i-ph-shooting-star-duotone',
    label: 'Star on GitHub',
    to: 'https://github.com/nuxt-hub/core',
    target: '_blank'
  }, {
    icon: 'i-ph-megaphone-duotone',
    label: 'Follow on X',
    to: 'https://x.com/nuxt_hub',
    target: '_blank'
  }, {
    icon: 'i-ph-chat-centered-text-duotone',
    label: 'Chat on Discord',
    to: 'https://discord.com/invite/nuxt',
    target: '_blank'
  }
]
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :title="changelog.title" :description="changelog.description" :ui="{ headline: 'flex flex-col gap-y-8 items-start' }">
        <template #headline>
          <UBreadcrumb :links="[{ label: 'Changelog', icon: 'i-ph-newspaper-duotone', to: '/changelog' }, { label: changelog.title }]" />

          <time class="text-gray-500 dark:text-gray-400">{{ formatDateByLocale('en', changelog.date) }}</time>
        </template>

        <div class="mt-4 flex flex-wrap items-center gap-6">
          <UButton
            v-for="(author, index) in changelog.authors"
            :key="index"
            :to="author.link"
            target="_blank"
            color="white"
            variant="ghost"
            class="-my-1.5 -mx-2.5"
          >
            <UAvatar :src="author.avatarUrl" :alt="author.name" />

            <div class="text-left">
              <p class="font-medium">
                {{ author.name }}
              </p>
              <p class="text-gray-500 dark:text-gray-400 leading-4">
                {{ `@${author.link.split('/').pop()}` }}
              </p>
            </div>
          </UButton>
        </div>
      </UPageHeader>

      <UPage>
        <UPageBody prose class="dark:text-gray-300 dark:prose-pre:!bg-gray-800/60">
          <ContentRenderer v-if="changelog && changelog.body" :value="changelog" />

          <div class="flex items-center justify-between mt-12 not-prose">
            <NuxtLink href="/changelog" class="text-primary">
              ← Back to changelog
            </NuxtLink>
            <div class="flex justify-end items-center gap-1.5">
              <UButton icon="i-ph-link-simple" v-bind="($ui.button.secondary as any)" @click="copyLink">
                Copy URL
              </UButton>
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
          <UContentToc v-if="changelog.body && changelog.body.toc" :links="changelog.body.toc.links">
            <template #bottom>
              <div class="hidden lg:block space-y-6">
                <UPageLinks title="Links" :links="links" />
              </div>
            </template>
          </UContentToc>
        </template>
      </UPage>
    </UPage>
  </UContainer>
</template>
