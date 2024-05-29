<script setup lang="ts">
const { data: templates } = await useFetch('/api/templates.json')
const { data: page } = await useAsyncData('templates', () => queryContent('/templates').findOne())

useSeoMeta({
  title: page.value.title,
  ogTitle: `${page.value.title} · NuxtHub`,
  description: page.value.description,
  ogDescription: page.value.description
})

defineOgImageComponent('Docs', {
  title: 'Templates'
})
</script>

<template>
  <UContainer>
    <UPageHero v-bind="page?.hero" />
    <UPageGrid class="pb-8">
      <UPageCard
        v-for="(template, index) in templates" :key="index"
        :ui="{ wrapper: 'overflow-hidden flex flex-col', body: { base: '!p-0 relative group' } }"
      >
        <div class="w-full aspect-[16/9] h-full">
          <div>
            <img
              :src="template.imageUrl"
              class="object-cover object-top w-full h-full xl:hidden" :alt="template.title" width="600" height="300"
              format="webp" :modifiers="{ pos: 'top' }"
            >
            <img
              :src="template.imageUrl"
              class="object-cover object-top w-full h-full hidden xl:block" :alt="template.title" width="280"
              height="140" format="webp" :modifiers="{ pos: 'top' }"
            >
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col items-start gap-2">
            <h3 class="inline-flex items-center gap-2 font-medium">
              {{ template.title }}
            </h3>
            <p class="text-sm">
              {{ template.description }}
            </p>
            <div class="flex items-center flex-wrap gap-1">
              <UBadge
                v-if="template.workersPaid"
                label="Workers Paid"
                color="amber"
                variant="subtle"
                size="sm"
                class="rounded-full"
              />
              <UBadge
                v-for="feature of template.features"
                :key="feature"
                :label="feature"
                size="sm"
                color="gray"
                class="rounded-full"
              />
            </div>
            <UButtonGroup class="mt-3 w-full">
              <UButton
                v-if="template.demoUrl"
                label="Demo"
                icon="i-ph-desktop-duotone"
                :to="template.demoUrl"
                target="_blank"
                size="sm"
                color="gray"
                class="w-1/2 justify-center"
                :ui="{ icon: { size: { sm: 'w-4 h-4' } } }"
              />
              <UButton
                label="GitHub"
                icon="i-simple-icons-github"
                :to="`https://github.com/${template.owner}/${template.repo}`"
                target="_blank"
                size="sm"
                color="gray"
                class="justify-center"
                :class="template.demoUrl ? 'w-1/2' : 'w-full'"
                :ui="{ icon: { size: { sm: 'w-4 h-4' } } }"
              />
            </UButtonGroup>
          </div>
        </template>
      </UPageCard>
    </UPageGrid>
  </UContainer>
</template>
