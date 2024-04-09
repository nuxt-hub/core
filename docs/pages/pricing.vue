<script setup lang="ts">
import { joinURL } from 'ufo'

const { data: page } = await useAsyncData('pricing', () => queryContent('/pricing').findOne())

const { url } = useSiteConfig()

useSeoMeta({
  title: page.value.title,
  ogTitle: page.value.title,
  description: page.value.description,
  ogDescription: page.value.description,
  ogImage: joinURL(url, '/social-card.png')
})

</script>

<template>
  <UContainer class="relative">
    <div class="absolute inset-0 bg-hero h-[500px]" />

    <UPageHero v-bind="page?.hero" align="center" :ui="{ wrapper: 'relative !pt-[144px] !pb-[92px]' }">
      <template #title>
        <span v-html="page?.hero.title" />
      </template>

      <template #description>
        {{ page?.hero.description }}
      </template>
    </UPageHero>


    <div class="pt-12 pb-24 lg:py-24">
      <UPricingGrid :compact="false">
        <UPricingCard v-for="pricing in page?.pricing.plans" :key="pricing.title" v-bind="pricing" />
      </UPricingGrid>

      <div class="w-full text-center pt-8 italic text-gray-500 dark:text-gray-400 text-sm">
        {{ page?.pricing.info }}
      </div>

      <UCard class="mt-8" :ui="{ body: { padding: 'md:p-[40px]' }}">
        <div class="flex justify-between items-center gap-x-8">
          <div class="flex flex-col gap-y-2">
            <h3 class="text-2xl font-semibold text-gray-950 dark:text-white">
              {{ page?.pricing.contact.title }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400" v-html="page?.pricing.contact.description" />
          </div>
          <UButton v-bind="page?.pricing.contact.button" />
        </div>
      </UCard>
    </div>

    <div class="py-24">
      <UPageHeader :title="page?.plan.title" :description="page?.plan.description" align="center" :ui="{ title: 'text-center w-full', wrapper: 'border-0' }" />
      <UTable class="pt-[78px]" :rows="page?.plan.d1.rows" :columns="page?.plan.d1.columns" :ui="{ divide: 'divide-y-0', th: { base: 'first:text-left text-center' }, td: { base: 'first:text-left text-center' }, tr: { base: '' }, tbody: '' }">
        <template #free-header="{ column }">
          <div class="flex flex-col gap-y-2">
            <span class="text-xl">{{ column.label }}</span>
            <span class="text-gray-500 dark:text-gray-400 text-sm font-normal">{{ page?.plan.free }}</span>
          </div>
        </template>
        <template #paid-header="{ column }">
          <div class="flex flex-col gap-y-2">
            <span class="text-xl">{{ column.label }}</span>
            <span class="text-gray-500 dark:text-gray-400 text-sm font-normal">{{ page?.plan.paid }}</span>
          </div>
        </template>
        <template #title-data="{ row }">
          {{ row.title.value }}
        </template>
        <template #free-data="{ row }">
          {{ row.free?.value ? row.free.value : '' }}
        </template>
        <template #paid-data="{ row }">
          {{ row.paid?.value ? row.paid.value : '' }}
        </template>
      </UTable>
      <div class="flex justify-center w-full pt-[64px]">
        <UButton v-bind="page?.plan.button" size="lg" class="w-fit" />
      </div>
    </div>

    <div class="py-24">
      <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight text-center w-full pb-12">
        FAQ
      </h1>
      <ULandingFAQ :items="page?.faq.items" class="pt-[64px]" />
    </div>
  </UContainer>
</template>

<style scoped lang="postcss">
.bg-hero {
  background-image: url("/images/pricing/hero-light.webp");
  background-repeat: no-repeat;
  background-position: center;
}

.dark .bg-hero {
  background-image: url("/images/pricing/hero-dark.webp");
  background-repeat: no-repeat;
  background-position: center;
}
</style>
