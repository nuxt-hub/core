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
  <div>
    <div class="absolute inset-0 bg-hero h-[500px] mt-12" />

    <UContainer class="relative">
      <UPageHero v-bind="page?.hero" align="center" :ui="{ wrapper: 'relative !pt-[144px] !pb-[92px]' }">
        <template #icon>
          <UBadge :label="page?.hero.headline" icon="" variant="outline" :ui="{ rounded: 'rounded-full' }" class="badge border-2 border-primary" />
        </template>

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
          <div class="flex flex-col gap-y-4 text-center sm:text-left sm:flex-row sm:gap-y-0 justify-between items-center gap-x-8">
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
        <UPageHeader :title="page?.cloudflare.title" :description="page?.cloudflare.description" align="center" :ui="{ title: 'text-center w-full', wrapper: 'border-0' }" />

        <UPageGrid :ui="{ wrapper: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-8' }">
          <UPageCard v-for="plan in page?.cloudflare.plans" :key="plan.title" :title="plan.title" :description="plan.description" :to="plan.to">
            <UIcon name="i-ph-arrow-up-right" class="absolute top-2 right-2 h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-950 group-hover:dark:text-white cursor-pointer" />
          </UPageCard>
        </UPageGrid>

        <div class="flex justify-center w-full pt-[64px]">
          <UButton v-bind="page?.cloudflare.button" size="lg" class="w-fit" />
        </div>
      </div>

      <div class="py-24">
        <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight text-center w-full pb-12">
          FAQ
        </h1>
        <ULandingFAQ :items="page?.faq.items" class="pt-[64px]" />
      </div>
    </UContainer>
  </div>
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

.badge {
  animation: neon 0.001s ease-in-out infinite alternate
}

@keyframes neon {
  from {
    box-shadow:
    0 0 1px rgba(0, 118, 70, 0),
    0 0 15px rgba(0, 220, 130, 0.15),
    0 0 1px rgba(0, 220, 130,0.25),
    0 0 6px rgba(0, 220, 130,0.50),
    0 0 12px rgba(0, 220, 130,0.40),
    0 0 22px rgba(0, 220, 130,0.25);
  }
  to {
    box-shadow:
    0 0 1px rgba(0, 118, 70, 0),
    0 0 15px rgba(0, 220, 130, 0.15),
    0 0 1px rgba(0, 220, 130,0.25),
    0 0 6px rgba(0, 220, 130,0.22),
    0 0 12px rgba(0, 220, 130,0.44),
    0 0 25px rgba(0, 220, 130, 0.50);
  }
}
</style>
