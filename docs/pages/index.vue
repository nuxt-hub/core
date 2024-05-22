<script setup lang="ts">
import mediumZoom from 'medium-zoom'
import { joinURL } from 'ufo'

const { data: page } = await useAsyncData('index', () => queryContent('/').findOne())

const { url } = useSiteConfig()

useSeoMeta({
  title: page.value.title,
  ogTitle: page.value.title,
  description: page.value.description,
  ogDescription: page.value.description,
  ogImage: joinURL(url, '/social-card.png')
})

onMounted(() => {
  mediumZoom('[data-zoom-src]', {
    margin: 5
  })
})
</script>

<template>
  <div>
    <HeroDark class="absolute hidden right-0 left-0 top-0 xl:top-16 w-full dark:block" />
    <HeroLight class="absolute right-0 left-0 top-0 xl:top-16 w-full dark:hidden" />

    <ULandingHero
      :title="page?.hero.title" :description="page?.hero.description" :links="page.hero.links" orientation="horizontal"
      :ui="{ container: 'flex flex-row justify-start items-center' }"
    >
      <template #headline>
        <UBadge v-if="page?.hero.headline" variant="subtle" size="lg" class="relative rounded-full font-semibold">
          {{ page?.hero.headline.label }}
          <UIcon
            v-if="page?.hero.headline.icon" :name="page?.hero.headline.icon"
            class="ml-1 w-4 h-4 pointer-events-none"
          />
        </UBadge>
      </template>

      <template #title>
        <MDC :value="page?.hero.title" />
      </template>

      <template #description>
        <span v-html="page?.hero.description" />
      </template>
    </ULandingHero>

    <ULandingSection :ui="{ wrapper: 'py-6 sm:py-12' }">
      <ul class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
        <li v-for="feature in page?.features" :key="feature.name" class="flex flex-col gap-y-2">
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
    <ULandingSection :headline="page?.deploy.headline" :title="page?.deploy.title" :links="page?.deploy.buttons">
      <template #title>
        <span v-html="page?.deploy.title" />
      </template>
      <template #description>
        <span v-html="page?.deploy.description" />
      </template>
      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 items-start justify-center">
        <li v-for="step in page?.deploy.steps" :key="step.title" class="flex flex-col gap-y-8 justify-center group">
          <NuxtImg
            :src="step.img.src" :width="step.img.width" :height="step.img.height" :alt="step.title"
            class="rounded-xl bg-gradient-to-r from-green-300 to-teal-500 group-hover:opacity-100 xl:opacity-90 transition duration-300"
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

    <!-- database section -->
    <ULandingSection
      :headline="page?.database.headline" :features="page?.database.features"
      :links="page?.database.buttons" align="left" :ui="{ features: { icon: { name: 'i-ph-check-circle-duotone' } } }"
    >
      <template #title>
        <span v-html="page?.database.title" />
      </template>
      <template #description>
        <span v-html="page?.database.description" />
      </template>
      <NuxtImg
        :src="page?.database.img.src" :width="page?.database.img.width" :height="page?.database.img.height" :alt="page?.database.title"
        :data-zoom-src="page?.database.img.src" class="border border-gray-200 dark:border-gray-800 rounded-md"
      />
    </ULandingSection>

    <div class="bg-gray-50 dark:bg-gray-900/30 py-10 border border-price border-x-transparent relative">
      <UColorModeImage
        light="/images/landing/pricing-line-light.svg" dark="/images/landing/pricing-line-dark.svg"
        class="absolute left-0 right-0 w-full sm:w-auto sm:h-full inset-y-0 pointer-events-none z-0" alt="Database pricing section background"
      />
      <UContainer class="grid grid-cols-1 lg:grid-cols-2 items-center">
        <div class="flex flex-col gap-y-2 z-10">
          <h2 class="font-semibold">
            {{ page?.database.pricing.title }}
          </h2>
          <ULink
            target="_blank" :to="page?.database.pricing.link.to"
            class="text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 hover:text-gray-400 transition transition-300 z-10"
          >
            {{ page?.database.pricing.link.label }}
            <UIcon name="i-ph-arrow-up-right-light" class="h-4 w-4" />
          </ULink>
        </div>
        <div class="flex flex-col sm:flex-row sm:justify-between gap-y-4 sm:gap-y-0 sm:gap-x-8 pt-8 lg:pt-0 z-10">
          <div v-for="price in page?.database.pricing.features" :key="price.title" class="flex flex-col gap-y-2">
            <h2 class="font-semibold">
              {{ price.title }}
            </h2>
            <p class="text-gray-500 dark:text-gray-400">
              {{ price.description }}
            </p>
          </div>
        </div>
      </UContainer>
    </div>

    <!-- blob section -->
    <ULandingSection
      :headline="page?.blob.headline" :features="page?.blob.features" :links="page?.blob.buttons"
      :ui="{ features: { icon: { name: 'i-ph-check-circle-duotone' } } }" align="right"
    >
      <template #title>
        <span v-html="page?.blob.title" />
      </template>
      <template #description>
        <span v-html="page?.blob.description" />
      </template>
      <NuxtImg
        :src="page?.blob.img.src" :width="page?.blob.img.width" :height="page?.blob.img.height" :alt="page?.blob.title"
        :data-zoom-src="page?.blob.img.src" class="border border-gray-200 dark:border-gray-800 rounded-md"
      />
    </ULandingSection>

    <div class="bg-gray-50 dark:bg-gray-900/30 py-10 border border-price border-x-transparent relative">
      <UColorModeImage
        light="/images/landing/pricing-line-light.svg" dark="/images/landing/pricing-line-dark.svg"
        class="absolute left-0 right-0 w-full sm:w-auto sm:h-full inset-y-0 z-0 pointer-events-none" alt="Blob pricing section background"
      />
      <UContainer class="grid grid-cols-1 lg:grid-cols-2 items-center">
        <div class="flex flex-col gap-y-2 z-10">
          <h2 class="font-semibold">
            {{ page?.blob.pricing.title }}
          </h2>
          <ULink
            target="_blank" :to="page?.blob.pricing.link.to"
            class="text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 hover:text-gray-400 transition transition-300 z-10"
          >
            {{ page?.blob.pricing.link.label }}
            <UIcon name="i-ph-arrow-up-right-light" class="h-4 w-4" />
          </ULink>
        </div>

        <div class="flex flex-col gap-y-4 sm:flex-row sm:justify-between sm:gap-y-0 sm:gap-x-8 pt-8 lg:pt-0 z-10">
          <div v-for="price in page?.blob.pricing.features" :key="price.title" class="flex flex-col gap-y-2">
            <h2 class="font-semibold">
              {{ price.title }}
            </h2>
            <p class="text-gray-500 dark:text-gray-400">
              {{ price.description }}
            </p>
          </div>
        </div>
      </UContainer>
    </div>

    <!-- KV section -->
    <ULandingSection
      :headline="page?.kv.headline" :features="page?.kv.features" :links="page?.kv.buttons"
      :ui="{ features: { icon: { name: 'i-ph-check-circle-duotone' } } }" align="left"
    >
      <template #title>
        <span v-html="page?.kv.title" />
      </template>
      <template #description>
        <span v-html="page?.kv.description" />
      </template>
      <NuxtImg
        :src="page?.kv.img.src" :width="page?.kv.img.width" :height="page?.kv.img.height" :alt="page?.kv.title"
        :data-zoom-src="page?.kv.img.src" class="border border-gray-200 dark:border-gray-800 rounded-md"
      />
    </ULandingSection>

    <div class="bg-gray-50 dark:bg-gray-900/30 py-10 border border-price border-x-transparent relative">
      <UColorModeImage
        light="/images/landing/pricing-line-light.svg" dark="/images/landing/pricing-line-dark.svg"
        class="absolute left-0 right-0 w-full sm:w-auto sm:h-full inset-y-0 z-0 pointer-events-none" alt="KV pricing section background"
      />
      <UContainer class="grid grid-cols-1 lg:grid-cols-2 items-center">
        <div class="flex flex-col gap-y-2 z-10">
          <h2 class="font-semibold">
            {{ page?.kv.pricing.title }}
          </h2>
          <ULink
            target="_blank" :to="page?.kv.pricing.link.to"
            class="text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 hover:text-gray-400 transition transition-300 z-10"
          >
            {{ page?.kv.pricing.link.label }}
            <UIcon name="i-ph-arrow-up-right-light" class="h-4 w-4" />
          </ULink>
        </div>
        <div class="grid grid-cols-1 gap-8 sm:flex justify-between gap-x-8 pt-8 lg:pt-0 z-10">
          <div v-for="price in page?.kv.pricing.features" :key="price.title" class="flex flex-col gap-y-2">
            <h2 class="font-semibold">
              {{ price.title }}
            </h2>
            <p class="text-gray-500 dark:text-gray-400">
              {{ price.description }}
            </p>
          </div>
        </div>
      </UContainer>
    </div>

    <!-- storage section -->
    <ULandingSection
      :headline="page?.storage.headline" :features="page?.storage.features"
      :links="page?.storage.buttons" :ui="{ features: { icon: { name: 'i-ph-check-circle-duotone' } } }" align="right"
    >
      <template #title>
        <span v-html="page?.storage.title" />
      </template>
      <template #description>
        <span v-html="page?.storage.description" />
      </template>
      <NuxtImg
        :src="page?.storage.img.src" :width="page?.storage.img.width" :height="page?.storage.img.height" :alt="page?.storage.title"
        :data-zoom-src="page?.storage.img.src"
      />
    </ULandingSection>

    <!-- tool section -->
    <div class="relative">
      <img src="/images/landing/bg-tailored.webp" width="1441" height="181" class="absolute top-0 w-full right-0" alt="Tailored section background">

      <ULandingSection :headline="page?.tool.headline" :links="page?.tool.buttons" class="relative">
        <template #title>
          <span v-html="page?.tool.title" />
        </template>
        <template #description>
          <span v-html="page?.tool.description" />
        </template>

        <ULandingGrid :ui="{ wrapper: 'flex flex-col md:grid gap-8 md:grid-cols-2 lg:grid-cols-4 relative' }">
          <ULandingCard
            v-for="tool in page?.tool.features" :key="tool.title" :description="tool.description"
            :ui="{ title: '', description: 'pl-8' }"
          >
            <template #title>
              <span class="flex flex-row gap-x-3 items-center">
                <img :src="tool.img" width="24" height="24" :alt="tool.title">
                <span class="text-gray-900 dark:text-white text-base font-bold truncate">
                  {{ tool.title }}
                </span>
              </span>
            </template>
          </ULandingCard>
        </ULandingGrid>
      </ULandingSection>
    </div>

    <!-- testomonials section -->
    <ULandingSection :headline="page?.testimonials.headline">
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

      <ULandingSection class="relative mt-32" :ui="{ title: 'z-10' }">
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
