<script setup lang="ts">
import { joinURL } from 'ufo'
import { formatDateByLocale } from '~/utils'

const { data: page } = await useAsyncData('changelog', () => queryContent('/changelog').findOne())

const { fetchList, changelogs } = useChangelog()

const dot = ref<HTMLElement>()
const dots = ref<HTMLElement[]>()
const container = ref<HTMLElement>()
const clotherPoint = ref<Boolean>(true)
const scrollTop = ref(0)

const { y } = useWindowScroll()
const { isScrolling } = useScroll(document)
const { url } = useSiteConfig()

useSeoMeta({
  title: page.value.title,
  ogTitle: page.value.title,
  description: page.value.description,
  ogDescription: page.value.description,
  ogImage: joinURL(url, '/social-card.png')
})

onMounted(() => { 
  dot.value.style.left = `${container.value[0].offsetLeft + 3 }px`
})

watch(() => y.value, () => {

  scrollTop.value = y.value

  const mobilePointTop = dot.value.getBoundingClientRect().top + window.scrollY

  const fixedPoints = dots.value.map(point => {
    return point.getBoundingClientRect().top + window.scrollY
  })

  for (let i = 0; i < fixedPoints.length; i++) {
    if (Math.abs(mobilePointTop - fixedPoints[i]) <= 200) {
      dots.value[i].classList.add('neon')
      clotherPoint.value = true
    } else {
      if (dots.value[i].classList.value.includes('neon')) {
        dots.value[i].classList.remove('neon')
        clotherPoint.value = false
      }
    }
  }
})

await fetchList()
</script>

<template>
  <UContainer v-if="page">
    <UPageHero v-bind="page?.hero" :ui="{ wrapper: 'border-none' }" />
    <ul class="flex flex-col relative">
      <div ref="dot" class="hidden lg:block absolute w-[2px] rounded-full bg-gray-500 dark:bg-gray-400 z-10 neon dot"
        :style="{ top: `${scrollTop}px`, height: `${isScrolling ? 80 : clotherPoint || y === 0 ? 0 : 80}px`, width: `${isScrolling ? 1 : clotherPoint || y === 0 ? 0 : 1}px` }" />
      <li v-for="(changelog, index) in changelogs" :key="changelog.title" class="relative flex w-full flex-col lg:flex-row last:mb-[2px] group">
        <div class="flex w-full pb-4 lg:w-[200px] lg:pb-0 -mt-1">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            <time class="top-24">{{ formatDateByLocale('en', changelog.date) }}</time>
          </p>
        </div>
        <div ref="container" class="relative hidden lg:flex lg:min-w-[150px] lg:w-[150px]">
          <div class="hidden lg:block left-4 top-24 h-2 w-2 rounded-full bg-gray-500 dark:bg-gray-400 z-10" :class="{ 'neon': index === 0 }" ref="dots" />

          <div class="absolute left-[3.5px] top-0.5 h-full w-[1px] bg-gray-400 dark:bg-gray-500" />
        </div>
        <div class="w-full pb-32">
          <NuxtLink :to="changelog._path">
            <div class="space-y-4 -mt-1">
              <div class="inline-block overflow-hidden">
                <img :alt="changelog.title" loading="lazy" width="1200" height="432" :src="changelog.img"
                  class="max-h-[432px] object-cover rounded-md group-hover:scale-[1.1] transition duration-300">
              </div>

              <div class="flex flex-col">
                <h2 class="text-4xl font-semibold">
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
.neon-active {
  box-shadow: 0 0 1px rgba(0, 118, 70, 0),
    0 0 15px rgba(0, 220, 130),
    0 0 1px rgba(0, 220, 130),
    0 0 6px rgba(0, 220, 130),
    0 0 12px rgba(0, 220, 130),
    0 0 22px rgba(0, 220, 130);

  transition: all 1s ease;
}

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
