<script setup lang="ts">
definePageMeta({
  primary: 'green'
})
const { data: page } = await useAsyncData('pricing', () => queryContent('/pricing').findOne())
const { data: home } = await useAsyncData('index', () => queryContent('/').findOne())

const isYearly = ref(true)
const isWorkersPaid = ref(false)

useSeoMeta({
  title: page.value.title,
  ogTitle: `${page.value.title} · NuxtHub`,
  description: page.value.description,
  ogDescription: page.value.description
})

defineOgImageComponent('Docs')
</script>

<template>
  <UContainer>
    <UPageHero align="center" :ui="{ base: 'z-10', wrapper: 'py-8 pb-0 sm:py-16 sm:pb-0' }">
      <!-- <template #icon>
          <UBadge :label="page?.hero.headline" icon="" variant="outline" :ui="{ rounded: 'rounded-full' }" class="badge dark:border border-primary" />
        </template> -->

      <template #title>
        <span v-html="page?.hero.title" />
      </template>

      <template #description>
        {{ page?.hero.description }}
      </template>
    </UPageHero>

    <div class="py-12">
      <div class="w-full flex justify-center">
        <UPricingToggle v-model="isYearly" class="max-w-xs mb-12" right="Yearly (2 months off)" />
      </div>

      <UPricingGrid :compact="false">
        <UPricingCard
          v-for="pricing in page?.pricing.plans" :key="pricing.title" v-bind="pricing"
          :price="pricing.price.monthly ? isYearly ? pricing.price.yearly : pricing.price.monthly : pricing.price"
          :cycle="pricing.cycle.monthly ? isYearly ? pricing.cycle.yearly : pricing.cycle.monthly : pricing.cycle"
        />
      </UPricingGrid>

      <div class="w-full text-center pt-8 italic text-gray-500 dark:text-gray-400 text-sm" v-html="page?.pricing.info" />

      <UCard class="mt-8" :ui="{ body: { padding: 'md:p-[40px]' } }">
        <div class="flex flex-col gap-y-4 text-center sm:text-left sm:flex-row sm:gap-y-0 justify-between items-center gap-x-8">
          <div class="flex flex-col gap-y-2">
            <h2 class="text-2xl font-semibold text-gray-950 dark:text-white">
              {{ page?.pricing.contact.title }}
            </h2>
            <p class="text-gray-500 dark:text-gray-400" v-html="page?.pricing.contact.description" />
          </div>
          <UButton v-bind="page?.pricing.contact.button" />
        </div>
      </UCard>
    </div>

    <div class="py-24">
      <ULandingSection :title="page?.cloudflare.title" :description="page?.cloudflare.description" :ui="{ wrapper: 'py-8 sm:py-12' }" />
      <div class="w-full flex justify-center">
        <UPricingToggle v-model="isWorkersPaid" class="max-w-[400px] mb-12" left="Workers Free" right="Workers Paid: $5/month" />
      </div>
      <UPageGrid :ui="{ wrapper: 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-8' }">
        <UPageCard v-for="plan in page?.cloudflare.plans" :key="plan.title" :title="plan.title" :to="plan.to">
          <UIcon name="i-ph-arrow-up-right" class="absolute top-2 right-2 h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-950 group-hover:dark:text-white cursor-pointer" />
          <template #description>
            <span v-html="plan[isWorkersPaid ? 'paid' : 'free']" />
          </template>
        </UPageCard>
      </UPageGrid>

      <div class="flex justify-center w-full pt-[64px]">
        <UButton v-bind="page?.cloudflare.button" size="md" class="w-fit" />
      </div>
    </div>

    <ULandingSection :title="page.faq.title" :description="page.faq.description" :ui="{ container: 'max-w-5xl' }">
      <ULandingFAQ :items="page?.faq.items" multiple>
        <template #item="{ item }">
          <MDC :value="item.content" class="prose prose-primary dark:prose-invert max-w-none text-gray-500 dark:text-gray-400" />
        </template>
      </ULandingFAQ>
    </ULandingSection>

    <ULandingSection class="sm:pt-12">
      <template #title>
        <span v-html="home?.testimonials.title" />
      </template>
      <template #description>
        <span v-html="home?.testimonials.description" />
      </template>

      <UPageColumns :ui="{ wrapper: 'column-1 md:columns-2 lg:columns-4 gap-8 space-y-8' }">
        <UPageCard
          :title="home?.testimonials.cloudflare.title" :description="home?.testimonials.cloudflare.description"
          :ui="{ title: 'whitespace-normal text-white dark:text-gray-950', description: 'text-gray-400 dark:text-gray-500', background: 'bg-gray-900 dark:bg-white' }"
        >
          <template #icon>
            <UColorModeImage
              :light="home?.testimonials.cloudflare.img.dark"
              :dark="home?.testimonials.cloudflare.img.light" alt="Cloudflare logo"
            />
          </template>
        </UPageCard>

        <div v-for="(testimonial, index) in home?.testimonials.items" :key="index" class="break-inside-avoid">
          <ULandingTestimonial v-bind="testimonial" />
        </div>
      </UPageColumns>
    </ULandingSection>
  </UContainer>
</template>

<style scoped lang="postcss">
.bg-hero {
  background-image: url("/images/pricing/hero-light.svg");
  background-repeat: no-repeat;
  background-position: center;
}

.dark .bg-hero {
  background-image: url("/images/pricing/hero-dark.svg");
  background-repeat: no-repeat;
  background-position: center;
}

.dark .badge {
  animation: neon 6s ease-in-out infinite;
  box-shadow: 0 0 1px rgba(0, 118, 70, 0),
              0 0 15px rgba(0, 220, 130, 0.15),
              0 0 1px rgba(0, 220, 130,0.25),
              0 0 6px rgba(0, 220, 130,0.50),
              0 0 12px rgba(0, 220, 130,0.40),
              0 0 22px rgba(0, 220, 130,0.25);

  text-shadow: 0 0 1px rgba(0, 118, 70, 0),
  0 0 15px rgba(0, 220, 130, 0.15),
  0 0 1px rgba(0, 220, 130,0.25),
  0 0 6px rgba(0, 220, 130,0.50),
  0 0 12px rgba(0, 220, 130,0.40),
  0 0 22px rgba(0, 220, 130,0.25);
}

@keyframes neon {
  38%, 40%, 44%, 46%, 57%, 58.5% {
    box-shadow: 0 0 1px rgba(0, 118, 70, 0),
              0 0 15px rgba(0, 220, 130, 0.15),
              0 0 1px rgba(0, 220, 130,0.25),
              0 0 6px rgba(0, 220, 130,0.50),
              0 0 12px rgba(0, 220, 130,0.40),
              0 0 22px rgba(0, 220, 130,0.25);

    text-shadow: 0 0 1px rgba(0, 118, 70, 0),
              0 0 15px rgba(0, 220, 130, 0.15),
              0 0 1px rgba(0, 220, 130,0.25),
              0 0 6px rgba(0, 220, 130,0.50),
              0 0 12px rgba(0, 220, 130,0.40),
              0 0 22px rgba(0, 220, 130,0.25);
  }
  39%, 43%, 45%, 58% {
    box-shadow: none;
    text-shadow: none;
  }
}
</style>
