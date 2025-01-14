<script setup lang="ts">
import mediumZoom from 'medium-zoom'
import { withoutTrailingSlash, joinURL } from 'ufo'
import type { BlogPost } from '~/types'

definePageMeta({
  primary: 'green',
  heroBackground: 'opacity-30'
})

const route = useRoute()
const { copy } = useCopyToClipboard()
const { toc } = useAppConfig()
const { url } = useSiteConfig()

const { data: post } = await useAsyncData(`blog-${route.params.slug}`, () => queryContent<BlogPost>(route.path).findOne())
if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

const { data: surround } = await useAsyncData(`blog-${route.params.slug}-surround`, () => queryContent()
  .where({ _extension: 'md', navigation: { $ne: false }, _path: { $regex: /^\/blog/ } })
  .without(['body', 'excerpt'])
  .sort({ date: -1 })
  .findSurround(withoutTrailingSlash(route.path))
)

const title = post.value.head?.title || post.value.title
const description = post.value.head?.description || post.value.description

useSeoMeta({
  titleTemplate: '%s · NuxtHub Blog',
  title,
  description,
  ogDescription: description,
  ogTitle: `${title} · NuxtHub Blog`
})

if (post.value.image) {
  defineOgImage({ url: joinURL(url, post.value.image) })
}

const socialLinks = computed(() => [{
  icon: 'i-simple-icons-linkedin',
  to: `https://www.linkedin.com/sharing/share-offsite/?url=https://hub.nuxt.com${post.value._path}`
}, {
  icon: 'i-simple-icons-x',
  to: `https://x.com/intent/tweet?text=${encodeURIComponent(`${post.value.title}\n\n`)}https://hub.nuxt.com${post.value._path}`
}])

function copyLink() {
  copy(`https://hub.nuxt.com${post.value._path}`, { title: 'Post URL to clipboard' })
}
onMounted(() => {
  mediumZoom('[data-zoom-src]', {
    margin: 5
  })
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :title="post.title" :description="post.description" :ui="{ headline: 'flex flex-col gap-y-8 items-start', description: 'text-gray-700 dark:text-gray-300' }">
        <template #headline>
          <UBreadcrumb :links="[{ label: 'Blog', to: '/blog' }, { label: post.title }]" :ui="{ wrapper: 'max-w-full' }" />
          <div class="flex items-center space-x-2">
            <UBadge :label="post?.category || 'Article'" color="gray" />
            <span class="text-gray-500 dark:text-gray-400">&middot;&nbsp;&nbsp;<time>{{ formatDateByLocale('en', post.date) }}</time></span>
          </div>
        </template>
        <div class="flex flex-wrap items-center gap-3 mt-4">
          <div class="mt-4 flex flex-wrap items-center gap-6">
            <UButton
              v-for="author in post.authors" :key="author.username" :to="author.to" target="_blank"
              color="white" variant="ghost" class="-my-1.5 -mx-2.5"
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
        </div>
      </UPageHeader>

      <UPage>
        <UPageBody prose class="dark:text-gray-300 dark:prose-pre:!bg-gray-800/60 lg:pr-10">
          <ContentRenderer v-if="post && post.body" :value="post" />
          <PageSectionCTA />
          <div class="flex items-center justify-between mt-12 not-prose">
            <UButton to="/blog" variant="link" :padded="false" color="gray" icon="i-lucide-arrow-left">
              Back to blog
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
          <UContentToc v-if="post.body && post.body.toc" :links="post.body.toc.links" :title="toc.title" />
        </template>
      </UPage>
    </UPage>
  </UContainer>
</template>
