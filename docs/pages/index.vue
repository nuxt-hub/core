<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryContent('/').findOne())

useSeoMeta({
  title: page.value.title,
  ogTitle: page.value.title,
  description: page.value.description,
  ogDescription: page.value.description
})

defineOgImage({
  component: 'Docs',
  title: page.value.title,
  description: page.value.description
})
</script>

<template>
  <ULandingHero v-bind="page.hero">
    <template #top><Background class="opacity-30" /></template>
    <template #headline>
      <UBadge v-if="page.hero.headline" variant="subtle" size="lg" class="relative rounded-full font-semibold">
        <NuxtLink :to="page.hero.headline.to" target="_blank" class="focus:outline-none" tabindex="-1">
          <span class="absolute inset-0" aria-hidden="true" />
        </NuxtLink>

        {{ page.hero.headline.label }}

        <UIcon v-if="page.hero.headline.icon" :name="page.hero.headline.icon" class="ml-1 w-4 h-4 pointer-events-none" />
      </UBadge>
    </template>

    <template #title>
      <MDC :value="page.hero.title" />
    </template>

    <MDC :value="page.hero.code" tag="pre" class="hero_code prose prose-primary dark:prose-invert lg:ml-auto" />
  </ULandingHero>

  <ULandingSection :title="page.features.title" :description="page.features.description" :links="page.features.links" class="pt-0 sm:pt-0">
    <UPageGrid>
      <ULandingCard v-for="(item, index) of page.features.items" :key="index" v-bind="item" />
    </UPageGrid>
  </ULandingSection>
</template>

<style lang="postcss">
.hero_code div div  {
  @apply dark:bg-gray-900/60 backdrop-blur-3xl bg-white/60;
}
</style>
