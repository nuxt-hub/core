<script setup lang="ts">
import mediumZoom from 'medium-zoom'
import { joinURL } from 'ufo'

const { data: page } = await useAsyncData('index', () => queryContent('/').findOne())

const { url } = useSiteConfig()
const videoModalOpen = ref(false)

useSeoMeta({
  title: page.value.title,
  ogTitle: `${page.value.title} · NuxtHub`,
  description: page.value.description,
  ogDescription: page.value.description,
  ogImage: joinURL(url, '/social-card.png')
})
const introVideoLink = page.value?.tool?.links?.find(link => link.id === 'intro-video') || {}
const demoVideoLink = page.value?.deploy?.links?.find(link => link.id === 'demo-video') || {}
const videoLink = ref('')

onMounted(() => {
  mediumZoom('[data-zoom-src]', {
    margin: 5
  })
  introVideoLink.click = (e) => {
    if (e.ctrlKey || e.metaKey) {
      return
    }
    e?.preventDefault()
    videoLink.value = introVideoLink.to
    videoModalOpen.value = true
  }
  demoVideoLink.click = (e) => {
    if (e.ctrlKey || e.metaKey) {
      return
    }
    e?.preventDefault()
    videoLink.value = demoVideoLink.to
    videoModalOpen.value = true
  }
})
</script>

<template>
  <div class="relative">
    <ULandingHero
      :title="page?.hero.title"
      :description="page?.hero.description"
      orientation="horizontal"
      :ui="{
        wrapper: 'py-20 sm:py-28 md:py-30 2xl:py-36',
        headline: 'mb-8',
        title: 'font-medium'
      }"
    >
      <template v-if="page?.hero.headline" #headline>
        <NuxtLink :to="page.hero.headline.to">
          <UBadge color="white" size="md" class="relative px-3 rounded-full font-semibold dark:hover:bg-gray-400/15 dark:hover:ring-gray-700">
            {{ page?.hero.headline.label }}
            <UIcon
              v-if="page?.hero.headline.icon" :name="page?.hero.headline.icon"
              class="ml-1 w-4 h-4 pointer-events-none"
            />
          </UBadge>
        </NuxtLink>
      </template>

      <template #links>
        <div class="flex flex-col gap-y-6">
          <div class="flex flex-wrap gap-x-6 gap-y-3">
            <UButton to="https://admin.hub.nuxt.com" external size="md" trailing-icon="i-ph-arrow-right">
              Get started for free
            </UButton>
            <UInputCopy value="npx nuxthub deploy" size="md" />
          </div>
          <div>
            <UAvatarGroup
              size="xs"
              :ui="{ margin: '-me-0.5' }"
              class="float-left mr-3"
            >
              <UAvatar
                v-for="i in [1, 2, 3, 4]"
                :key="i"
                :src="`/images/landing/companies/logo-${i}-dark.svg`"
                class="dark:bg-gray-800 p-[5px] hidden dark:inline-flex"
              />
              <UAvatar
                v-for="i in [1, 2, 3, 4]"
                :key="i"
                :src="`/images/landing/companies/logo-${i}-light.svg`"
                class="bg-gray-100 p-[5px] dark:hidden"
              />
              <UAvatar
                text="..."
                class="dark:bg-gray-800 bg-gray-100 p-[5px]"
                :ui="{ text: 'text-gray-500 dark:text-gray-400 relative -top-[3px]' }"
              />
            </UAvatarGroup>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              Used and loved by <span class="font-medium dark:text-white text-gray-900">5K+ developers and teams</span>.
            </span>
          </div>
          <UDivider type="dashed" class="w-24" />
          <div class="flex flex-col gap-y-2">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              “Nuxt on Cloudflare infra with minimal effort - this is huge!”
            </p>
            <div class="flex items-center flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
              <UAvatar src="https://avatars.githubusercontent.com/u/499550?v=4" size="xs" alt="Evan You" />
              <span class="font-medium dark:text-white text-gray-900">Evan You</span>
              <span>•</span>
              <span>Author of Vue.js and Vite.</span>
            </div>
          </div>
        </div>
      </template>

      <img
        src="/images/landing/hero-screenshot-dark.svg"
        class="hidden dark:lg:block absolute right-0 h-[300px] lg:h-[380px] xl:h-[440px] 2xl:h-[540px]"
        alt="NuxtHub Deploy page"
      >
      <img
        src="/images/landing/hero-screenshot-light.svg"
        class="hidden dark:hidden lg:block absolute right-0 h-[300px] lg:h-[380px] xl:h-[440px] 2xl:h-[540px]"
        alt="NuxtHub Deploy page"
      >

      <UModal v-model="videoModalOpen" :ui="{ width: 'sm:max-w-4xl lg:max-w-5xl aspect-[16/9]' }">
        <div class="p-3 h-full">
          <iframe
            width="100%"
            height="100%"
            :src="`https://www.youtube-nocookie.com/embed/${videoLink.split('=')[1]}`"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          />
        </div>
      </UModal>
    </ULandingHero>

    <!-- features section -->
    <ULandingSection :ui="{ wrapper: 'py-6 sm:py-12' }">
      <ul class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-8">
        <li
          v-for="feature in page?.features"
          :key="feature.name"
          class="flex items-start gap-x-3 relative group"
          :class="{ 'opacity-75': feature.soon }"
        >
          <NuxtLink v-if="feature.to" :to="feature.to" class="absolute inset-0 z-10" />
          <div class="p-[3px] border border-dashed rounded-md dark:border-gray-700 border-gray-300">
            <div class="dark:bg-gray-900 bg-gray-100 p-1.5 rounded-md flex items-center justify-center border dark:border-gray-800">
              <UIcon :name="feature.icon" class="size-6 flex-shrink-0" />
            </div>
          </div>
          <div class="flex flex-col">
            <h2 class="font-medium text-gray-900 dark:text-white inline-flex items-center gap-x-1">
              {{ feature.name }} <UBadge v-if="feature.soon" color="white" size="xs" class="rounded-full">
                Soon
              </UBadge>
              <UIcon v-if="feature.to" name="i-ph-arrow-right" class="size-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0" />
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ feature.description }}
            </p>
          </div>
        </li>
      </ul>
    </ULandingSection>

    <!-- creator testimonial -->
    <ULandingSection
      :ui="{
        wrapper: 'relative my-12 py-6 sm:py-12 bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 border-t border-b dark:border-gray-800',
        container: 'gap-y-6 text-center'
      }"
    >
      <ULandingTestimonial
        :quote="page?.creator.quote"
        :author="page?.creator.author"
        :ui="{
          quote: 'text-gray-500 dark:text-gray-400',
          author: {
            wrapper: 'justify-center text-left items-center'
          }
        }"
        :card="false"
      />
    </ULandingSection>

    <!-- tool section -->
    <ULandingSection
      :links="page?.tool.links"
      :ui="{
        base: 'text-left items-start',
        links: '!justify-start'
      }"
      align="center"
      :title="page?.tool.title"
      :description="page?.tool.description"
    >
      <ULandingGrid :ui="{ wrapper: 'flex flex-col md:grid gap-8 md:grid-cols-2 lg:grid-cols-4 relative' }">
        <div v-for="tool in page?.tool.features" :key="tool.title" class="flex flex-col gap-y-2">
          <UIcon :name="tool.icon" class="w-5 h-5 flex-shrink-0 text-black dark:text-primary" />
          <h3 class="font-bold dark:text-white">
            {{ tool.title }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ tool.description }}
          </p>
        </div>
      </ULandingGrid>
    </ULandingSection>

    <!-- deploy section -->
    <ULandingSection :links="page?.deploy.links" class="relative">
      <svg class="absolute top-0 inset-x-0 pointer-events-none opacity-30 dark:opacity-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 1017 181"><g opacity=".5"><mask id="c" fill="#fff"><path d="M0 0h1017v181H0V0Z" /></mask><path fill="url(#a)" fill-opacity=".5" d="M0 0h1017v181H0V0Z" /><path fill="url(#b)" d="M0 2h1017v-4H0v4Z" mask="url(#c)" /></g><defs><radialGradient id="a" cx="0" cy="0" r="1" gradientTransform="rotate(90.177 244.7795736 263.4645037) scale(161.501 509.002)" gradientUnits="userSpaceOnUse"><stop stop-color="#334155" /><stop offset="1" stop-color="#334155" stop-opacity="0" /></radialGradient><linearGradient id="b" x1="10.9784" x2="1017" y1="91" y2="90.502" gradientUnits="userSpaceOnUse"><stop stop-color="#334155" stop-opacity="0" /><stop offset=".395" stop-color="#334155" /><stop offset="1" stop-color="#334155" stop-opacity="0" /></linearGradient></defs></svg>
      <template #title>
        <span v-html="page?.deploy.title" />
      </template>
      <template #description>
        <span v-html="page?.deploy.description" />
      </template>
      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 items-start justify-center">
        <li v-for="step in page?.deploy.steps" :key="step.title" class="flex flex-col gap-y-8 justify-center group">
          <NuxtImg
            :src="step.img.srcDark"
            :width="step.img.width"
            :height="step.img.height"
            :alt="step.title"
            class="hidden dark:block"
            lazy
          />
          <NuxtImg
            :src="step.img.srcLight"
            :width="step.img.width"
            :height="step.img.height"
            :alt="step.title"
            class="block dark:hidden"
            lazy
          />
          <div>
            <h2 class="font-semibold" v-html="step.title" />
            <p class="text-gray-500 dark:text-gray-400">
              {{ step.description }}
            </p>
          </div>
        </li>
      </ul>
    </ULandingSection>

    <!-- Full Stack section -->
    <ULandingSection
      :title="page?.fullStack.title"
      :links="page?.fullStack.buttons"
      :ui="{
        title: 'font-medium',
        base: 'text-left items-start'
      }"
    >
      <template #title>
        <span v-html="page?.fullStack.title" />
      </template>
      <template #description>
        <span v-html="page?.fullStack.description" />
      </template>
    </ULandingSection>

    <!-- database section -->
    <ULandingSection
      align="left"
      :ui="{
        wrapper: 'pt-0 sm:pt-0 pb-24',
        container: 'gap-y-8 sm:gap-y-12',
        title: 'text-xl sm:text-2xl lg:text-3xl font-semibold',
        description: 'text-base mt-3 dark:text-gray-400'
      }"
    >
      <template #headline>
        <div class="flex items-center gap-1.5">
          <UIcon :name="page?.database.headline.icon" class="w-5 h-5 flex-shrink-0 text-black dark:text-primary" />
          <span class="text-xs uppercase dark:text-gray-400 text-gray-500">{{ page?.database.headline.title }}</span>
        </div>
      </template>
      <template #title>
        <span v-html="page?.database.title" />
      </template>
      <template #description>
        <span v-html="page?.database.description" />
        <UDivider class="w-1/4 mt-6" type="dashed" />
        <div class="flex flex-col gap-y-3 mt-6 dark:text-gray-300">
          <span class="text-xs uppercase dark:text-gray-400">Major Features</span>
          <div v-for="feature in page?.database.features" :key="feature.title" class="flex items-center gap-2">
            <UIcon :name="feature.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ feature.name }}</span>
          </div>
          <div>
            <UButton to="/docs/features/database" size="xs" trailing-icon="i-ph-arrow-right" color="gray" :padded="false" variant="link">
              Learn more
            </UButton>
          </div>
        </div>
      </template>
      <UColorModeImage
        :light="page?.database.img.srcLight"
        :dark="page?.database.img.srcDark"
        :width="page?.database.img.width"
        :height="page?.database.img.height"
        :alt="page?.database.title"
      />
    </ULandingSection>

    <!-- blob section -->
    <ULandingSection
      align="right"
      :ui="{
        wrapper: 'pt-0 sm:pt-0 pb-24',
        container: 'gap-y-8 sm:gap-y-12',
        title: 'text-xl sm:text-2xl lg:text-3xl font-semibold',
        description: 'text-base mt-3 dark:text-gray-400'
      }"
    >
      <template #headline>
        <div class="flex items-center gap-1.5">
          <UIcon :name="page?.blob.headline.icon" class="w-5 h-5 flex-shrink-0 text-black dark:text-primary" />
          <span class="text-xs uppercase dark:text-gray-400 text-gray-500">{{ page?.blob.headline.title }}</span>
        </div>
      </template>
      <template #title>
        <span v-html="page?.blob.title" />
      </template>
      <template #description>
        <span v-html="page?.blob.description" />
        <UDivider class="w-1/4 mt-6" type="dashed" />
        <div class="flex flex-col gap-y-3 mt-6 dark:text-gray-300">
          <span class="text-xs uppercase dark:text-gray-400">Major Features</span>
          <div v-for="feature in page?.blob.features" :key="feature.title" class="flex items-center gap-2">
            <UIcon :name="feature.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ feature.name }}</span>
          </div>
          <div>
            <UButton to="/docs/features/blob" size="xs" trailing-icon="i-ph-arrow-right" color="gray" :padded="false" variant="link">
              Learn more
            </UButton>
          </div>
        </div>
      </template>
      <UColorModeImage
        :light="page?.blob.img.srcLight"
        :dark="page?.blob.img.srcDark"
        :width="page?.blob.img.width"
        :height="page?.blob.img.height"
        :alt="page?.blob.title"
      />
    </ULandingSection>

    <!-- KV section -->
    <ULandingSection
      align="left"
      :ui="{
        wrapper: 'pt-0 sm:pt-0 pb-24',
        container: 'gap-y-8 sm:gap-y-12',
        title: 'text-xl sm:text-2xl lg:text-3xl font-semibold',
        description: 'text-base mt-3 dark:text-gray-400'
      }"
    >
      <template #headline>
        <div class="flex items-center gap-1.5">
          <UIcon :name="page?.kv.headline.icon" class="w-5 h-5 flex-shrink-0 text-black dark:text-primary" />
          <span class="text-xs uppercase dark:text-gray-400 text-gray-500">{{ page?.kv.headline.title }}</span>
        </div>
      </template>
      <template #title>
        <span v-html="page?.kv.title" />
      </template>
      <template #description>
        <span v-html="page?.kv.description" />
        <UDivider class="w-1/4 mt-6" type="dashed" />
        <div class="flex flex-col gap-y-3 mt-6 dark:text-gray-300">
          <span class="text-xs uppercase dark:text-gray-400">Major Features</span>
          <div v-for="feature in page?.kv.features" :key="feature.title" class="flex items-center gap-2">
            <UIcon :name="feature.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ feature.name }}</span>
          </div>
          <div>
            <UButton to="/docs/features/kv" size="xs" trailing-icon="i-ph-arrow-right" color="gray" :padded="false" variant="link">
              Learn more
            </UButton>
          </div>
        </div>
      </template>
      <UColorModeImage
        :light="page?.kv.img.srcLight"
        :dark="page?.kv.img.srcDark"
        :width="page?.kv.img.width"
        :height="page?.kv.img.height"
        :alt="page?.kv.title"
      />
    </ULandingSection>
    <!-- AI section -->
    <ULandingSection
      align="right"
      :ui="{
        wrapper: 'pt-0 sm:pt-0 pb-24 mb-10',
        container: 'gap-y-8 sm:gap-y-12',
        title: 'text-xl sm:text-2xl lg:text-3xl font-semibold',
        description: 'text-base mt-3 dark:text-gray-400'
      }"
    >
      <template #headline>
        <div class="flex items-center gap-1.5">
          <UIcon :name="page?.ai.headline.icon" class="w-5 h-5 flex-shrink-0 dark:text-primary text-black" />
          <span class="text-xs uppercase dark:text-gray-400 text-gray-500">{{ page?.ai.headline.title }}</span>
        </div>
      </template>
      <template #title>
        <span v-html="page?.ai.title" />
      </template>
      <template #description>
        <span v-html="page?.ai.description" />
        <UDivider class="w-1/4 mt-6" type="dashed" />
        <div class="flex flex-col gap-y-3 mt-6 dark:text-gray-300">
          <span class="text-xs uppercase dark:text-gray-400">Major Features</span>
          <div v-for="feature in page?.ai.features" :key="feature.title" class="flex items-center gap-2">
            <UIcon :name="feature.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ feature.name }}</span>
          </div>
          <div class="flex items-center gap-3">
            <UButton to="/docs/features/ai" size="xs" trailing-icon="i-ph-arrow-right" color="gray" :padded="false" variant="link">
              AI docs
            </UButton>
            <UButton to="/docs/features/ai" size="xs" trailing-icon="i-ph-arrow-right" color="gray" :padded="false" variant="link">
              Vectorize docs
            </UButton>
          </div>
        </div>
      </template>
      <UColorModeImage
        :light="page?.ai.img.srcLight"
        :dark="page?.ai.img.srcDark"
        :width="page?.ai.img.width"
        :height="page?.ai.img.height"
        :alt="page?.ai.title"
      />
    </ULandingSection>
    <!-- Cache section -->
    <ULandingSection
      align="left"
      :ui="{
        wrapper: 'pt-0 sm:pt-0 pb-24',
        container: 'gap-y-8 sm:gap-y-12',
        title: 'text-xl sm:text-2xl lg:text-3xl font-semibold',
        description: 'text-base mt-3 dark:text-gray-400'
      }"
    >
      <template #headline>
        <div class="flex items-center gap-1.5">
          <UIcon :name="page?.cache.headline.icon" class="w-5 h-5 flex-shrink-0 text-black dark:text-primary" />
          <span class="text-xs uppercase dark:text-gray-400 text-gray-500">{{ page?.cache.headline.title }}</span>
        </div>
      </template>
      <template #title>
        <span v-html="page?.cache.title" />
      </template>
      <template #description>
        <span v-html="page?.cache.description" />
        <UDivider class="w-1/4 mt-6" type="dashed" />
        <div class="flex flex-col gap-y-3 mt-6 dark:text-gray-300">
          <span class="text-xs uppercase dark:text-gray-400">Major Features</span>
          <div v-for="feature in page?.cache.features" :key="feature.title" class="flex items-center gap-2">
            <UIcon :name="feature.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ feature.name }}</span>
          </div>
          <div>
            <UButton to="/docs/features/cache" size="xs" trailing-icon="i-ph-arrow-right" color="gray" :padded="false" variant="link">
              Learn more
            </UButton>
          </div>
        </div>
      </template>
      <UColorModeImage
        :light="page?.cache.img.srcLight"
        :dark="page?.cache.img.srcDark"
        :width="page?.cache.img.width"
        :height="page?.cache.img.height"
        :alt="page?.cache.title"
      />
    </ULandingSection>

    <!-- browser rendering section -->
    <ULandingSection
      align="right"
      :ui="{
        wrapper: 'pt-0 sm:pt-0 pb-24 mb-10',
        container: 'gap-y-8 sm:gap-y-12',
        title: 'text-xl sm:text-2xl lg:text-3xl font-semibold',
        description: 'text-base mt-3 dark:text-gray-400'
      }"
    >
      <template #headline>
        <div class="flex items-center gap-1.5">
          <UIcon :name="page?.browser.headline.icon" class="w-5 h-5 flex-shrink-0 dark:text-primary text-black" />
          <span class="text-xs uppercase dark:text-gray-400 text-gray-500">{{ page?.browser.headline.title }}</span>
        </div>
      </template>
      <template #title>
        <span v-html="page?.browser.title" />
      </template>
      <template #description>
        <span v-html="page?.browser.description" />
        <UDivider class="w-1/4 mt-6" type="dashed" />
        <div class="flex flex-col gap-y-3 mt-6 dark:text-gray-300">
          <span class="text-xs uppercase dark:text-gray-400">Major Features</span>
          <div v-for="feature in page?.browser.features" :key="feature.title" class="flex items-center gap-2">
            <UIcon :name="feature.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ feature.name }}</span>
          </div>
          <div>
            <UButton to="/docs/features/browser" size="xs" trailing-icon="i-ph-arrow-right" color="gray" :padded="false" variant="link">
              Learn more
            </UButton>
          </div>
        </div>
      </template>
      <UColorModeImage
        :light="page?.browser.img.srcLight"
        :dark="page?.browser.img.srcDark"
        :width="page?.browser.img.width"
        :height="page?.browser.img.height"
        :alt="page?.browser.title"
      />
    </ULandingSection>

    <!-- remote storage section -->
    <ULandingSection
      align="left"
      :ui="{
        wrapper: 'pt-0 sm:pt-0 pb-24',
        container: 'gap-y-8 sm:gap-y-12',
        title: 'text-xl sm:text-2xl lg:text-3xl font-semibold',
        description: 'text-base mt-3 dark:text-gray-400'
      }"
    >
      <template #headline>
        <div class="flex items-center gap-1.5">
          <UIcon :name="page?.storage.headline.icon" class="w-5 h-5 flex-shrink-0 dark:text-primary text-black" />
          <span class="text-xs uppercase dark:text-gray-400 text-gray-500">{{ page?.storage.headline.title }}</span>
        </div>
      </template>
      <template #title>
        <span v-html="page?.storage.title" />
      </template>
      <template #description>
        <span v-html="page?.storage.description" />
        <UDivider class="w-1/4 mt-6" type="dashed" />
        <div class="flex flex-col gap-y-3 mt-6 dark:text-gray-300">
          <span class="text-xs uppercase dark:text-gray-400">Major Features</span>
          <div v-for="feature in page?.storage.features" :key="feature.title" class="flex items-center gap-2">
            <UIcon :name="feature.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ feature.name }}</span>
          </div>
          <div>
            <UButton to="/docs/getting-started/remote-storage" size="xs" trailing-icon="i-ph-arrow-right" color="gray" :padded="false" variant="link">
              Learn more
            </UButton>
          </div>
        </div>
      </template>
      <UColorModeImage
        :light="page?.storage.img.srcLight"
        :dark="page?.storage.img.srcDark"
        :width="page?.storage.img.width"
        :height="page?.storage.img.height"
        :alt="page?.storage.title"
      />
    </ULandingSection>

    <!-- testimonials section -->
    <ULandingSection>
      <template #title>
        <span v-html="page?.testimonials.title" />
      </template>
      <template #description>
        <span v-html="page?.testimonials.description" />
      </template>

      <UPageColumns :ui="{ wrapper: 'column-1 md:columns-2 lg:columns-4 gap-8 space-y-8' }">
        <UPageCard
          :title="page?.testimonials.cloudflare.title" :description="page?.testimonials.cloudflare.description"
          :ui="{ title: 'whitespace-normal text-white dark:text-gray-950', description: 'text-gray-400 dark:text-gray-500', background: 'bg-gray-900 dark:bg-white' }"
        >
          <template #icon>
            <UColorModeImage
              :light="page?.testimonials.cloudflare.img.dark"
              :dark="page?.testimonials.cloudflare.img.light" alt="Cloudflare logo"
            />
          </template>
        </UPageCard>

        <div v-for="(testimonial, index) in page?.testimonials.items" :key="index" class="break-inside-avoid">
          <ULandingTestimonial v-bind="testimonial" />
        </div>
      </UPageColumns>
    </ULandingSection>

    <PageSectionCTA loose />
  </div>
</template>

<style lang="postcss">
.hero_code div div {
  @apply dark:bg-gray-900/60 backdrop-blur-3xl bg-white/60;
}

.medium-zoom-overlay {
  @apply dark:!bg-gray-950 !bg-white;
}

.medium-zoom-overlay,
.medium-zoom-image--opened {
  z-index: 100;
}
</style>
