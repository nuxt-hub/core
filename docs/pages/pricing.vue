<script setup lang="ts">
definePageMeta({
  primary: 'green'
})
const { data: page } = await useAsyncData('pricing', () => queryContent('/pricing').findOne())
const { data: home } = await useAsyncData('index', () => queryContent('/').findOne())

const isYearly = ref(true)

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

const demoVideoLink = home.value?.deploy?.buttons?.find(link => link.id === 'demo-video') || {}
const videoLink = ref('')
const videoModalOpen = ref(false)

onMounted(() => {
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
  <div>
    <UContainer>
      <UPageHero align="center" :ui="{ base: 'z-10', wrapper: 'py-12 pb-0 sm:py-24 sm:pb-0' }">
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
          <UPricingToggle
            v-model="isYearly"
            class="max-w-xs mb-8 sm:mb-16"
            right="Yearly (2 months off)"
            :ui="{
              marker: 'bg-primary-500 dark:bg-green-400'
            }"
          />
        </div>

        <UPricingGrid class="gap-12">
          <UPricingCard
            v-for="pricing in page?.pricing.plans"
            :key="pricing.title"
            v-bind="pricing"
            :price="pricing.price.monthly ? isYearly ? pricing.price.yearly : pricing.price.monthly : pricing.price"
            :cycle="pricing.cycle.monthly ? isYearly ? pricing.cycle.yearly : pricing.cycle.monthly : pricing.cycle"
          >
            <template #features>
              <ul class="space-y-3 text-sm">
                <li v-for="(feature, index) of pricing.features" :key="index" class="flex items-center gap-x-3 min-w-0">
                  <UIcon :name="feature.icon" class="w-5 h-5 flex-shrink-0" :class="[pricing.highlight ? 'text-primary' : 'text-gray-500 dark:text-gray-400']" />
                  <span class="text-gray-600 dark:text-gray-400 truncate">{{ feature.title }}</span>
                </li>
              </ul>
            </template>
          </UPricingCard>
        </UPricingGrid>

        <div class="w-full text-center pt-8 sm:pt-12 italic text-gray-500 dark:text-gray-400 text-sm" v-html="page?.pricing.info" />

        <UCard class="mt-8" :ui="{ body: { padding: 'md:p-[40px]' } }">
          <div class="flex flex-col gap-y-4 text-center sm:text-left sm:flex-row sm:gap-y-0 justify-between items-center gap-x-8">
            <div class="flex flex-col gap-y-2">
              <h2 class="text-base sm:text-2xl font-semibold text-gray-950 dark:text-white">
                {{ page?.pricing.contact.title }}
              </h2>
              <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400" v-html="page?.pricing.contact.description" />
            </div>
            <UButton v-bind="page?.pricing.contact.button" />
          </div>
        </UCard>
      </div>
    </UContainer>

    <ULandingSection
      id="cloudflare-pricing"
      :title="page?.cloudflare.title"
      align="center"
      :ui="{
        base: 'text-left items-start',
        wrapper: 'py-12 sm:py-24',
        container: 'gap-y-8 sm:gap-y-12 lg:items-start',
        title: 'text-2xl sm:text-3xl lg:text-3xl font-semibold',
        description: 'text-base mt-3 dark:text-gray-400'
      }"
    >
      <template #description>
        <span>{{ page?.cloudflare.description }}</span>
        <div class="mt-6">
          <UButton v-bind="page?.cloudflare.button" />
        </div>
      </template>
      <UTabs
        class="pt-8 sm:pt-0 pb-20 sm:pb-0 sm:w-full w-[calc(100vw-32px)]"
        :items="page?.cloudflare.plans"
        :ui="{
          list: {
            background: 'dark:bg-gray-950 border dark:border-gray-800 bg-white',
            height: 'h-[42px]',
            marker: {
              background: 'bg-gray-100 dark:bg-gray-800'
            },
            tab: {
              icon: 'hidden sm:inline-flex'
            }
          }
        }"
      >
        <template #item="{ item }">
          <UTable
            v-bind="item"
            class="border dark:border-gray-800 border-gray-200 rounded-lg"
            :ui="{
              divide: 'dark:divide-gray-800 divide-gray-200'
            }"
          >
            <template #paid-data="{ row }">
              <span v-html="row.paid" />
            </template>
          </UTable>
          <div v-if="item.buttons?.length" class="mt-2 flex items-center gap-2 justify-center">
            <UButton v-for="button of item.buttons" :key="button.to" v-bind="button" color="gray" size="xs" variant="link" trailing-icon="i-lucide-arrow-up-right" target="_blank" />
          </div>
        </template>
      </UTabs>
      <ULandingTestimonial v-if="evanTestimonial" v-bind="evanTestimonial" :card="false" />
    </ULandingSection>
    <!-- Deploy -->
    <ULandingSection :title="home?.deploy.title" :links="home?.deploy.buttons" class="relative">
      <HeroBackground
        class="absolute w-full top-[1px] transition-all text-primary flex-shrink-0 left-0 right-0"
      />
      <template #title>
        <span v-html="home?.deploy.title" />
      </template>
      <template #description>
        <span v-html="home?.deploy.description" />
      </template>
      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 items-start justify-center">
        <li v-for="step in home?.deploy.steps" :key="step.title" class="flex flex-col gap-y-8 justify-center group">
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
    </ULandingSection>
    <ULandingSection :title="page.faq.title" :description="page.faq.description" :ui="{ container: 'max-w-5xl' }">
      <ULandingFAQ :items="page?.faq.items" multiple>
        <template #item="{ item }">
          <div class="prose prose-primary dark:prose-invert max-w-none text-gray-500 dark:text-gray-400" v-html="item.content" />
        </template>
      </ULandingFAQ>
    </ULandingSection>
  </div>
</template>
