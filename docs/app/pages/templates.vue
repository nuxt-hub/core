<script setup lang="ts">
definePageMeta({
  primary: 'green'
})

interface Template {
  title: string
  description: string
  imageUrl: string
  owner: string
  repo: string
  features: string[]
  demoUrl: string
  workersPaid: boolean
  slug: string
}

const { data } = await useFetch<Template[]>('/api/templates.json')
const route = useRoute()
const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('templates').first()
})

const { data: featurePaths } = await useAsyncData('featurePaths', () =>
  queryCollection('docs').where('path', 'LIKE', '/docs/features/%').select('path').all()
)

const templates = computed(() => {
  if (!data.value) return []

  return data.value.map(template => ({
    ...template,
    features: template.features.map(feature => ({
      name: feature,
      hasPage: featurePaths.value?.some(item => item.path === `/docs/features/${feature}`) || false
    }))
  }))
})

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
    <UPageHero
      :title="page?.hero.title"
      :description="page?.hero.description"
      :links="page?.hero.links"
    >
      <template #title>
        <MDC :value="page?.hero.title" unwrap="p" />
      </template>
    </UPageHero>
    <UBlogPosts class="lg:grid-cols-3 xl:grid-cols-4 pb-10">
      <UBlogPost
        v-for="(template, index) in templates"
        :key="index"
        :title="template.title"
        :description="template.description"
        :image="template.imageUrl"
        variant="subtle"
        :ui="{
          body: '!p-4 flex-1',
          image: 'border-b border-default',
          description: 'space-y-2',
          footer: 'p-4 pt-0'
        }"
      >
        <template #title>
          <div class="flex flex-1 items-center justify-between">
            <span class="text-gray-900 dark:text-white text-base font-semibold truncate">
              {{ template.title }}
            </span>
            <UButton
              icon="i-simple-icons-github"
              :to="`https://github.com/${template.owner}/${template.repo}`"
              target="_blank"
              size="xs"
              color="neutral"
              variant="ghost"
              class="opacity-75 hover:opacity-100"
            />
          </div>
        </template>
        <template #description>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ template.description }}
          </p>
          <div class="flex items-center flex-wrap gap-1">
            <UBadge
              v-if="template.workersPaid"
              label="Workers Paid"
              variant="subtle"
              size="sm"
              class="rounded-full"
            />
            <template v-for="feature of template.features" :key="feature.name">
              <NuxtLink v-if="feature.hasPage" :to="`/docs/features/${feature.name}`">
                <UBadge
                  :label="feature.name"
                  color="neutral"
                  variant="subtle"
                  class="rounded-full hover:text-black dark:hover:text-white"
                />
              </NuxtLink>
              <UBadge
                v-else
                :label="feature.name"
                color="neutral"
                variant="subtle"
                class="rounded-full"
              />
            </template>
          </div>
        </template>
        <template #footer>
          <UButtonGroup class="w-full">
            <UButton
              v-if="template.demoUrl"
              label="Demo"
              trailing-icon="i-lucide-arrow-up-right"
              :to="template.demoUrl"
              target="_blank"
              size="sm"
              color="neutral"
              variant="subtle"
              class="w-1/2 justify-center"
              :ui="{ trailingIcon: 'size-4' }"
            />
            <UButton
              label="Deploy"
              icon="i-lucide-cloud-upload"
              :to="`https://hub.nuxt.com/new?template=${template.slug}`"
              size="sm"
              color="neutral"
              variant="subtle"
              class="justify-center"
              :class="template.demoUrl ? 'w-1/2' : 'w-full'"
              :ui="{ trailingIcon: 'size-4' }"
            />
          </UButtonGroup>
        </template>
      </UBlogPost>
    </UBlogPosts>
  </UContainer>
</template>
