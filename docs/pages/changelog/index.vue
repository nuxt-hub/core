<script setup lang="ts">
import { joinURL } from 'ufo'
import { formatDateByLocale } from '~/utils'

const { data: page } = await useAsyncData('changelog', () => queryContent('/changelog').findOne())

const { fetchList, changelogs } = useBlog()
const { url } = useSiteConfig()

useSeoMeta({
  title: page.value.title,
  ogTitle: page.value.title,
  description: page.value.description,
  ogDescription: page.value.description,
  ogImage: joinURL(url, '/social-card.png')
})

await fetchList()
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page?.hero" :ui="{ wrapper: 'border-none' }" />
    <ul class="flex flex-col">
      <li v-for="changelog in changelogs" :key="changelog.title" class="relative flex w-full flex-col lg:flex-row last:mb-[2px]">
        <div class="flex w-full pb-4 lg:w-[200px] lg:pb-0 -mt-1">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            <time class="sticky top-24">{{ formatDateByLocale('en', changelog.date) }}</time>
          </p>
        </div>
        <div class="relative hidden lg:flex lg:w-[150px]">
          <div class="sticky left-4 top-24 h-2 w-2 rounded-full bg-gray-500 dark:bg-gray-400 z-10 neon" />

          <div class="absolute left-[3.5px] top-0.5 h-full w-[1px] bg-gray-500 dark:bg-gray-400" />
        </div>
        <div class="w-full pb-16">
          <NuxtLink :to="`/changelog/${changelog.title}`">
            <div class="space-y-4 -mt-1">
              <img :alt="changelog.title" loading="lazy" width="821" height="432" :src="changelog.img" class="rounded-lg">
              <div class="flex flex-col">
                <h2
                  class="text-4xl font-semibold">
                  {{ changelog.title }}</h2>
                <p class="text-lg pt-2 pb-4 text-gray-500 dark:text-gray-400">{{
                  changelog.description }}</p>
                <div class="mt-4 flex flex-wrap items-center gap-6">
                  <UButton v-for="(author, index) in changelog.authors" :key="index" :to="author.link" target="_blank"
                    color="white" variant="ghost" class="-my-1.5 -mx-2.5">
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
              </div>
            </div>
          </NuxtLink>
        </div>
      </li>
    </ul>
  </UContainer>
</template>

<style lang="postcss">
.neon {
  box-shadow: 0 0 1px rgba(0, 118, 70, 0),
    0 0 15px rgba(242, 245, 249, 0.15),
    0 0 1px rgba(242, 245, 249, 0.25),
    0 0 6px rgba(242, 245, 249, 0.50),
    0 0 12px rgba(242, 245, 249, 0.40),
    0 0 22px rgba(242, 245, 249, 0.25);
}
</style>
