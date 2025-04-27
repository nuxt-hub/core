<script setup lang="ts">
definePageMeta({
  primary: 'green'
})
const { data: page } = await useAsyncData('pricing', () => queryCollection('pricing').first())
const { data: home } = await useAsyncData('index', () => queryCollection('index').first())

const yearly = ref('0')

const isYearly = computed(() => yearly.value === '1')

const items = ref([
  {
    label: 'Monthly',
    value: '0'
  },
  {
    label: 'Yearly (2 months off)',
    value: '1'
  }
])

useSeoMeta({
  title: page.value.title,
  ogTitle: `${page.value.title} · NuxtHub`,
  description: page.value.description,
  ogDescription: page.value.description
})

defineOgImageComponent('Docs')

const evanTestimonial = computed(() => {
  return home.value?.testimonials.items.find(item => item.author.name === 'Evan You')
})

const demoVideoLink = home.value?.deploy?.links?.find(link => link.id === 'demo-video')
const videoLink = ref('')
const videoModalOpen = ref(false)

onMounted(() => {
  if (demoVideoLink) {
    document.body.querySelector(`#${demoVideoLink.id}`)?.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) {
        return
      }
      e?.preventDefault()
      videoLink.value = demoVideoLink.to
      videoModalOpen.value = true
    })
  }
})
</script>

<template>
  <UPageHero :ui="{ root: 'z-10', container: 'py-12 pb-0 sm:py-24 sm:pb-0' }">
    <!-- <template #icon>
          <UBadge :label="page?.hero.headline" icon="" variant="outline" :ui="{ rounded: 'rounded-full' }" class="badge dark:border border-primary" />
        </template> -->

    <template #title>
      <MDC :value="page?.hero.title" unwrap="p" />
    </template>

    <template #description>
      {{ page?.hero.description }}
    </template>

    <template #links>
      <div class="w-full flex justify-center">
        <UTabs
          v-model="yearly"
          :items="items"
          size="xs"
          class="max-w-xs mb-8 sm:mb-16 w-full max-w-sm"
          :ui="{
            list: 'rounded-full bg-default border border-accented',
            indicator: 'rounded-full',
            trigger: 'text-sm'
          }"
        />
      </div>

      <UPricingPlans class="xl:gap-12">
        <UPricingPlan
          v-for="pricing in page?.pricing.plans"
          :key="pricing.title"
          v-bind="pricing"
          :price="isYearly ? pricing.price.yearly : pricing.price.monthly"
          :billing-cycle="isYearly ? pricing.billingCycle.yearly : pricing.billingCycle.monthly"
          :ui="{ description: 'text-left' }"
        >
          <template #features>
            <ul class="space-y-3 text-sm">
              <li v-for="(feature, index) of pricing.features" :key="index" class="flex items-center gap-x-2 min-w-0">
                <UIcon :name="feature.icon" class="size-4 flex-shrink-0" :class="[pricing.highlight ? 'text-primary' : 'text-gray-500 dark:text-gray-400']" />
                <span class="text-gray-600 dark:text-gray-400 truncate">{{ feature.title }}</span>
              </li>
            </ul>
          </template>
        </UPricingPlan>
      </UPricingPlans>

      <div class="w-full text-center pt-8 sm:pt-12 italic text-gray-500 dark:text-gray-400 text-sm" v-html="page?.pricing.info" />

      <UPageCard variant="subtle" class="mt-8" :ui="{ body: 'md:p-[40px]' }">
        <div class="flex flex-col gap-y-4 text-center sm:text-left sm:flex-row sm:gap-y-0 justify-between items-center gap-x-8">
          <div class="flex flex-col gap-y-2">
            <h2 class="text-base sm:text-2xl font-semibold text-gray-950 dark:text-white">
              {{ page?.pricing.contact.title }}
            </h2>
            <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400" v-html="page?.pricing.contact.description" />
          </div>
          <UButton v-bind="page?.pricing.contact.button" />
        </div>
      </UPageCard>
    </template>
  </UPageHero>

  <UPageSection
    id="cloudflare-pricing"
    :title="page?.cloudflare.title"
    :ui="{
      container: 'gap-y-8 sm:gap-y-12 lg:items-start py-12 sm:py-24',
      title: 'text-2xl sm:text-3xl lg:text-3xl font-semibold text-left',
      description: 'text-base mt-3 dark:text-gray-400 text-left'
    }"
  >
    <template #description>
      <span>{{ page?.cloudflare.description }}</span>
      <div class="mt-6">
        <UButton v-bind="page?.cloudflare.button" />
      </div>
    </template>
    <PricingTable />
    <UPageCard v-if="evanTestimonial" variant="naked" :description="evanTestimonial.quote" :ui="{ description: 'before:content-[open-quote] after:content-[close-quote] text-highlighted' }">
      <template #footer>
        <UUser v-bind="evanTestimonial.author" />
      </template>
    </UPageCard>
  </UPageSection>
  <!-- Deploy -->
  <UPageSection :title="home?.deploy.title" :links="home?.deploy.links" class="relative">
    <HeroBackground
      class="absolute w-full top-[1px] transition-all text-primary flex-shrink-0 left-0 right-0"
    />
    <template #title>
      <MDC :value="home?.deploy.title" />
    </template>
    <template #description>
      <MDC :value="home?.deploy.description" />
    </template>
    <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 items-start justify-center">
      <li v-for="step in home?.deploy.steps" :key="step.title" class="flex flex-col gap-y-8 justify-center group">
        <NuxtImg
          :src="step.image.dark"
          :width="step.image.width"
          :height="step.image.height"
          :alt="step.title"
          class="hidden dark:block"
          lazy
        />
        <NuxtImg
          :src="step.image.light"
          :width="step.image.width"
          :height="step.image.height"
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
    <UModal v-model:open="videoModalOpen" :ui="{ content: 'sm:max-w-4xl lg:max-w-5xl aspect-[16/9]' }">
      <template #content>
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
      </template>
    </UModal>
  </UPageSection>
  <UPageSection :title="page.faq.title" :description="page.faq.description" :ui="{ container: 'max-w-5xl' }">
    <UPageAccordion :items="page?.faq.items" multiple>
      <template #body="{ item }">
        <MDC :value="item.content" unwrap="p" />
      </template>
    </UPageAccordion>
  </UPageSection>
</template>
