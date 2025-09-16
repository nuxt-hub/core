<script setup lang="ts">
// @ts-expect-error yaml is not typed
import page from './.changelog.yml'

definePageMeta({
  primary: 'green'
})
const { data: posts } = await useAsyncData('changelogs', async () => {
  return queryCollection('changelog')
    .where('extension', '=', 'md')
    .select('title', 'date', 'image', 'description', 'path', 'authors')
    .order('date', 'DESC')
    .all()
})

const dot = ref<HTMLElement>()
const dots = ref<HTMLElement[]>()
const container = ref<HTMLElement>()
const clotherPoint = ref<boolean>(true)
const scrollTop = ref(0)

const { y } = useWindowScroll()
const { isScrolling, arrivedState } = useScroll(document)

useHead({
  link: [
    { rel: 'alternate', type: 'application/rss+xml', title: 'NuxtHub Changelog', href: '/changelog/feed.xml' }
  ]
})
useSeoMeta({
  title: page.title,
  ogTitle: `${page.title} · NuxtHub`,
  description: page.description,
  ogDescription: page.description
})

defineOgImageComponent('Docs')

onMounted(() => {
  dot.value.style.left = `${container.value[0].offsetLeft + 3}px`
})

watch(() => y.value, () => {
  scrollTop.value = y.value

  const mobilePointTop = dot.value.getBoundingClientRect().top + window.scrollY

  const fixedPoints = dots.value.map((point) => {
    return point.getBoundingClientRect().top + window.scrollY
  })

  if (!(arrivedState.top || arrivedState.bottom)) {
    for (let i = 0; i < fixedPoints.length; i++) {
      if (Math.abs(mobilePointTop - fixedPoints[i]) <= 100) {
        dots.value[i].classList.add('neon')
        clotherPoint.value = true
      } else {
        if (dots.value[i].classList.value.includes('neon')) {
          dots.value[i].classList.remove('neon')
          clotherPoint.value = false
        }
      }
    }
  }
})

watch(() => arrivedState.top, () => {
  if (arrivedState.top === true) {
    dots.value[0].classList.add('neon')
  }
})
watch(() => arrivedState.bottom, () => {
  if (arrivedState.bottom === true) {
    dots.value[dots.value.length - 1].classList.add('neon')
  }
})
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page.hero" :ui="{ root: 'z-10' }" />
    <div class="relative">
      <div
        ref="dot" class="hidden lg:block absolute w-[2px] rounded-full bg-gray-500 dark:bg-gray-400 z-10 neon dot"
        :style="{ top: `${scrollTop}px`, height: `${isScrolling ? 40 : (clotherPoint || arrivedState.top || arrivedState.bottom) ? 0 : 40}px`, width: `${isScrolling ? 1 : clotherPoint ? 0 : 1}px` }"
      />
      <ul class="flex flex-col">
        <li
          v-for="(changelog, index) in posts" :key="changelog.title"
          class="relative flex w-full flex-col lg:flex-row last:mb-[2px] group"
        >
          <div class="flex w-full pb-4 lg:w-[200px] lg:pb-0 -mt-1">
            <div>
              <NuxtLink :to="changelog.path" class="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
                <time class="top-24">{{ formatDateByLocale('en', changelog.date) }}</time>
              </NuxtLink>
            </div>
          </div>
          <div ref="container" class="relative hidden lg:flex lg:min-w-[150px] lg:w-[150px]">
            <div
              ref="dots"
              class="hidden lg:block left-4 top-24 h-2 w-2 rounded-full bg-gray-500 dark:bg-gray-400 z-10" :class="{ neon: index === 0 }"
            />

            <div class="absolute left-[3.5px] top-0.5 h-full w-[1px] bg-gray-400 dark:bg-gray-500" />
          </div>
          <div class="w-full mb-32 relative">
            <div class="space-y-4 -mt-1">
              <NuxtLink :to="changelog.path" :aria-label="changelog.title" class="inline-block overflow-hidden rounded-md border dark:border-gray-800 border-gray-200">
                <NuxtImg
                  :alt="changelog.title || ''"
                  loading="lazy"
                  width="915"
                  height="515"
                  :src="changelog.image"
                  :placeholder="[91, 51, 50, 4]"
                  format="webp"
                  class="aspect-[16/9] object-cover hover:scale-105 transition duration-300 h-full"
                />
              </NuxtLink>

              <div class="flex flex-col">
                <h2 class="text-3xl font-semibold">
                  <NuxtLink :to="changelog.path" class="hover:underline underline-offset-4 decoration-1">
                    {{ changelog.title }}
                  </NuxtLink>
                </h2>
                <p class="text-lg pt-1 pb-2 text-gray-500 dark:text-gray-400">
                  {{
                    changelog.description }}
                </p>
                <div class="mt-4 flex flex-wrap items-center gap-6">
                  <UButton
                    v-for="author in changelog.authors" :key="author.username" :to="author.to" target="_blank"
                    color="neutral" variant="ghost" class="-my-1.5 -mx-2.5"
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
            </div>
          </div>
        </li>
      </ul>
    </div>
  </UContainer>
</template>

<style lang="postcss">
.neon {
  box-shadow: 0 0 1px rgba(0, 118, 70, 0),
    0 0 15px rgba(242, 245, 249),
    0 0 1px rgba(242, 245, 249),
    0 0 6px rgba(242, 245, 249),
    0 0 12px rgba(242, 245, 249),
    0 0 22px rgba(242, 245, 249);

  transition: all 1s ease;
}

.dot {
  transition: top 0.2s linear, height 0.4s ease, width 0.3s ease, left 0.3s ease;
}
</style>
