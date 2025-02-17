<script setup lang="ts">
import mediumZoom from 'medium-zoom'
import { joinURL } from 'ufo'

definePageMeta({
  primary: 'green',
  heroBackground: 'opacity-30'
})

const route = useRoute()
const { toc } = useAppConfig()
const { url } = useSiteConfig()

const { data: post } = await useAsyncData(`blog-${route.params.slug}`, () => {
  return queryCollection('blog').path(route.path).first()
})
if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

const { copy, copied } = useClipboard({ source: `https://hub.nuxt.com${post.value.path}` })

const { data: surround } = await useAsyncData(`blog-${route.params.slug}-surround`, () => {
  return queryCollectionItemSurroundings('blog', route.path, {
    fields: ['description']
  })
})

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

onMounted(() => {
  mediumZoom('[data-zoom-src]', {
    margin: 5
  })
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader :title="post.title" :description="post.description" :ui="{ headline: 'flex flex-col gap-y-8 items-start' }">
        <template #headline>
          <UBreadcrumb :items="[{ label: 'Blog', to: '/blog' }, { label: post.title }]" :ui="{ wrapper: 'max-w-full' }" />
          <div class="flex items-center space-x-2">
            <UBadge :label="post?.category || 'Article'" color="neutral" variant="subtle" />
            <span class="text-(--ui-text-muted)">&middot;&nbsp;&nbsp;<time>{{ formatDateByLocale('en', post.date) }}</time></span>
          </div>
        </template>
        <div class="flex flex-wrap items-center gap-3 mt-4">
          <div class="mt-4 flex flex-wrap items-center gap-6">
            <UButton
              v-for="author in post.authors" :key="author.username" :to="author.to" target="_blank"
              color="neutral" variant="ghost" class="-my-1.5 -mx-2.5"
            >
              <UAvatar :src="author.avatar?.src" :alt="author.name" />

              <div class="text-left">
                <p class="font-medium">
                  {{ author.name }}
                </p>
                <p class="text-(--ui-text-muted) leading-4">
                  {{ `@${author.username}` }}
                </p>
              </div>
            </UButton>
          </div>
        </div>
      </UPageHeader>

      <UPage>
        <UPageBody class="lg:pr-10">
          <ContentRenderer v-if="post && post.body" :value="post" />
          <PageSectionCTA />
          <div class="flex items-center justify-between mt-12 not-prose">
            <UButton to="/blog" variant="link" :padded="false" color="gray" icon="i-lucide-arrow-left">
              Back to blog
            </UButton>
            <div class="flex justify-end items-center gap-1.5">
              Share:
              <UButton :icon="copied ? 'i-lucide-check' : 'i-lucide-link'" :color="copied ? 'success' : 'neutral'" variant="ghost" @click="copy()" />
              <UButton
                v-for="(link, index) in socialLinks"
                :key="index"
                v-bind="link"
                variant="ghost"
                color="neutral"
                target="_blank"
              />
            </div>
          </div>

          <USeparator v-if="surround?.length" />

          <UContentSurround :surround="surround" />
        </UPageBody>

        <template #right>
          <UContentToc v-if="post.body && post.body.toc" :links="post.body.toc.links" :title="toc.title" />
        </template>
      </UPage>
    </UPage>
  </UContainer>
</template>
