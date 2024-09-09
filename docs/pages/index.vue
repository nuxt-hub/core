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
const introVideoLink = page.value?.hero?.links?.find(link => link.id === 'intro-video') || {}
const demoVideoLink = page.value?.deploy?.buttons?.find(link => link.id === 'demo-video') || {}
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

const accelerate = ref(false)
onMounted(() => {
  const { isOutside } = useMouseInElement(document.getElementById('get-started'))
  watch(isOutside, (value) => {
    accelerate.value = !value
  })
})
</script>

<template>
  <div class="relative">
    <HeroParticules :accelerate />
    <ULandingHero
      :title="page?.hero.title"
      :description="page?.hero.description"
      :links="page.hero.links"
    >
      <template v-if="page?.hero.headline" #headline>
        <NuxtLink :to="page.hero.headline.to">
          <UBadge variant="subtle" size="lg" class="relative rounded-full font-semibold dark:hover:bg-primary-400/15 dark:hover:ring-primary-700">
            {{ page?.hero.headline.label }}
            <UIcon
              v-if="page?.hero.headline.icon" :name="page?.hero.headline.icon"
              class="ml-1 w-4 h-4 pointer-events-none"
            />
          </UBadge>
        </NuxtLink>
      </template>

      <template #title>
        <span v-html="page?.hero.title" />
      </template>

      <template #description>
        <span v-html="page?.hero.description" />
      </template>

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

    <ULandingSection :ui="{ wrapper: 'py-6 sm:py-12' }">
      <ul class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
        <li
          v-for="feature in page?.features" :key="feature.name" class="flex flex-col gap-y-2 border-l border-green-500 pl-4" style="border-image: linear-gradient(to bottom, #00DC82, rgba(0, 0, 0, 0)) 1 100%;"
        >
          <img :src="feature.img" width="32" height="32" :alt="feature.name">
          <div class="flex flex-col gap-y-1">
            <h2 class="font-medium text-gray-900 dark:text-white">
              {{ feature.name }}
            </h2>
            <p class="text-gray-500 dark:text-gray-400">
              {{ feature.description }}
            </p>
          </div>
        </li>
      </ul>
    </ULandingSection>

    <!-- deploy section -->
    <ULandingSection :title="page?.deploy.title" :links="page?.deploy.buttons">
      <template v-if="page?.deploy.headline" #headline>
        <UBadge color="white" size="lg" class="rounded-full mb-6">
          {{ page?.deploy.headline }}
        </UBadge>
      </template>
      <template #title>
        <span v-html="page?.deploy.title" />
      </template>
      <template #description>
        <span v-html="page?.deploy.description" />
      </template>
      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 items-start justify-center">
        <li v-for="step in page?.deploy.steps" :key="step.title" class="flex flex-col gap-y-8 justify-center group">
          <NuxtImg
            :src="step.img.src"
            :width="step.img.width"
            :height="step.img.height"
            :alt="step.title"
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

    <!-- tool section -->
    <div class="relative">
      <img src="/images/landing/bg-tailored.webp" width="1441" height="181" class="absolute top-0 w-full right-0" alt="Tailored section background">

      <ULandingSection :links="page?.tool.buttons" class="relative">
        <template v-if="page?.tool.headline" #headline>
          <UBadge color="white" size="lg" class="rounded-full mb-6">
            {{ page?.tool.headline }}
          </UBadge>
        </template>
        <template #title>
          <span v-html="page?.tool.title" />
        </template>
        <template #description>
          <span v-html="page?.tool.description" />
        </template>

        <ULandingGrid :ui="{ wrapper: 'flex flex-col md:grid gap-8 md:grid-cols-2 lg:grid-cols-4 relative' }">
          <ULandingCard
            v-for="tool in page?.tool.features" :key="tool.title" :title="tool.title" :description="tool.description"
          />
        </ULandingGrid>
      </ULandingSection>
    </div>

    <!-- Full Stack section -->
    <ULandingSection
      :title="page?.fullStack.title"
      :links="page?.fullStack.buttons"
      :ui="{
        title: 'text-4xl'
      }"
    >
      <template v-if="page?.fullStack.headline" #headline>
        <UBadge color="white" size="lg" class="rounded-full mb-6">
          {{ page?.fullStack.headline }}
        </UBadge>
      </template>
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
          <UIcon :name="page?.database.headline.icon" class="w-5 h-5 flex-shrink-0" />
          <span class="text-xs uppercase dark:text-gray-400 text-gray-500">{{ page?.database.headline.title }}</span>
        </div>
      </template>
      <template #title>
        <span v-html="page?.database.title" />
      </template>
      <template #description>
        <span v-html="page?.database.description" />
        <UDivider class="w-1/4 mt-10" type="dashed" />
        <div class="flex flex-col gap-y-3 mt-6 dark:text-gray-300">
          <span class="text-xs uppercase dark:text-gray-400">Major Features</span>
          <div v-for="feature in page?.database.features" :key="feature.title" class="flex items-center gap-2">
            <UIcon :name="feature.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ feature.name }}</span>
          </div>
        </div>
      </template>
      <NuxtImg
        :src="page?.database.img.src" :width="page?.database.img.width" :height="page?.database.img.height" :alt="page?.database.title"
        :data-zoom-src="page?.database.img.src" class="border border-gray-200 dark:border-gray-800 rounded-md"
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
          <UIcon :name="page?.blob.headline.icon" class="w-5 h-5 flex-shrink-0" />
          <span class="text-xs uppercase dark:text-gray-400 text-gray-500">{{ page?.blob.headline.title }}</span>
        </div>
      </template>
      <template #title>
        <span v-html="page?.blob.title" />
      </template>
      <template #description>
        <span v-html="page?.blob.description" />
        <UDivider class="w-1/4 mt-10" type="dashed" />
        <div class="flex flex-col gap-y-3 mt-6 dark:text-gray-300">
          <span class="text-xs uppercase dark:text-gray-400">Major Features</span>
          <div v-for="feature in page?.blob.features" :key="feature.title" class="flex items-center gap-2">
            <UIcon :name="feature.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ feature.name }}</span>
          </div>
        </div>
      </template>
      <NuxtImg
        :src="page?.blob.img.src" :width="page?.blob.img.width" :height="page?.blob.img.height" :alt="page?.blob.title"
        :data-zoom-src="page?.blob.img.src" class="border border-gray-200 dark:border-gray-800 rounded-md"
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
          <UIcon :name="page?.kv.headline.icon" class="w-5 h-5 flex-shrink-0" />
          <span class="text-xs uppercase dark:text-gray-400 text-gray-500">{{ page?.kv.headline.title }}</span>
        </div>
      </template>
      <template #title>
        <span v-html="page?.kv.title" />
      </template>
      <template #description>
        <span v-html="page?.kv.description" />
        <UDivider class="w-1/4 mt-10" type="dashed" />
        <div class="flex flex-col gap-y-3 mt-6 dark:text-gray-300">
          <span class="text-xs uppercase dark:text-gray-400">Major Features</span>
          <div v-for="feature in page?.kv.features" :key="feature.title" class="flex items-center gap-2">
            <UIcon :name="feature.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ feature.name }}</span>
          </div>
        </div>
      </template>
      <NuxtImg
        :src="page?.kv.img.src" :width="page?.kv.img.width" :height="page?.kv.img.height" :alt="page?.kv.title"
        :data-zoom-src="page?.kv.img.src" class="border border-gray-200 dark:border-gray-800 rounded-md"
      />
    </ULandingSection>

    <!-- remote storage section -->
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
          <UIcon :name="page?.storage.headline.icon" class="w-5 h-5 flex-shrink-0" />
          <span class="text-xs uppercase dark:text-gray-400 text-gray-500">{{ page?.storage.headline.title }}</span>
        </div>
      </template>
      <template #title>
        <span v-html="page?.storage.title" />
      </template>
      <template #description>
        <span v-html="page?.storage.description" />
        <UDivider class="w-1/4 mt-10" type="dashed" />
        <div class="flex flex-col gap-y-3 mt-6 dark:text-gray-300">
          <span class="text-xs uppercase dark:text-gray-400">Major Features</span>
          <div v-for="feature in page?.storage.features" :key="feature.title" class="flex items-center gap-2">
            <UIcon :name="feature.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ feature.name }}</span>
          </div>
        </div>
      </template>
      <NuxtImg
        :src="page?.storage.img.src" :width="page?.storage.img.width" :height="page?.storage.img.height" :alt="page?.storage.title"
        :data-zoom-src="page?.storage.img.src" class="border border-gray-200 dark:border-gray-800 rounded-md"
      />
    </ULandingSection>

    <!-- testimonials section -->
    <ULandingSection>
      <template v-if="page?.testimonials.headline" #headline>
        <UBadge color="white" size="lg" class="rounded-full mb-6">
          {{ page?.testimonials.headline }}
        </UBadge>
      </template>
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

    <!-- journey section -->
    <div class="relative">
      <div
        class="flex justify-center absolute left-0 right-0 -top-8 sm:-top-10 md:-top-12 lg:-top-20 xl:-top-32 2xl:-top-42"
      >
        <UColorModeImage
          :light="page?.journey.images.light" :dark="page?.journey.images.dark"
          :width="page?.journey.images.width" :height="page?.journey.images.height" class="w-full" alt="Journey section background"
        />
      </div>

      <ULandingSection class="relative mt-32" :ui="{ title: 'z-10 2xl:pt-10' }">
        <template #title>
          <span v-html="page?.journey.title" />
        </template>

        <div
          class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16 lg:px-16 text-center z-10"
        >
          <NuxtLink
            v-for="feature in page?.journey.features" :key="feature.name" :to="feature.to"
            class="flex flex-col gap-y-2 items-center hover:ring-primary hover:ring-2 rounded-lg p-4"
          >
            <img :src="feature.img" width="32" height="32" :alt="feature.name">
            <div class="flex flex-col gap-y-1">
              <h2 class="font-medium text-gray-900 dark:text-white">
                {{ feature.name }}
              </h2>
              <p class="text-gray-500 dark:text-gray-400">
                {{ feature.description }}
              </p>
            </div>
          </NuxtLink>
        </div>

        <template #bottom>
          <div class="flex w-full justify-center items-center space-x-4 pt-[92px]">
            <UInputCopy v-bind="page?.journey.copybutton" class="w-[240px]" />
            <UButton v-bind="page?.journey.button" />
          </div>
        </template>
      </ULandingSection>
    </div>
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

.dark .border-price {
  border-image: linear-gradient(to right, rgba(30, 41, 59, 0.12), rgba(30, 41, 59, 1), rgba(30, 41, 59, 0.12)) 1;
}

.light .border-price {
  border-image: linear-gradient(to right, rgba(226, 232, 240, 0.12), rgba(226, 232, 240, 1), rgba(226, 232, 240, 0.12)) 1;
}
</style>
