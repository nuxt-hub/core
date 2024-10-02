<script setup lang="ts">
const source = ref<string>('https://hub.nuxt.com/images/landing/nuxthub-schema.png')
const options = reactive({
  width: 600,
  height: 400,
  format: 'webp',
  rotate: 0
})

const { data: blobData } = await useFetch('/api/blob', {
  query: {
    folded: false,
    limit: 4
  },
  deep: true
})

const imageSrc = computed(() => {
  return `/_hub/image/${Object.entries(options).map(([key, value]) => `${key}=${value}`).join(',')}/${source.value}`
})

const files = computed(() => blobData.value?.blobs || [])
</script>

<template>
  <UCard>
    <div class="flex gap-4 mb-4">
      <UFormGroup label="Width x Height">
        <div class="flex gap-2">
          <USelect
            v-model="options.width"
            :options="[300, 600, 900, 1200]"
          />
          x
          <USelect
            v-model="options.height"
            :options="[200, 400, 600, 800]"
          />
        </div>
      </UFormGroup>
      <UFormGroup label="Rotate">
        <USelect
          v-model="options.rotate"
          :options="[0, 90, 180, 270]"
        />
      </UFormGroup>
      <UFormGroup label="Format">
        <USelect
          v-model="options.format"
          :options="['webp', 'jpeg', 'png']"
        />
      </UFormGroup>
    </div>
    <div class="flex-1 h-96 flex items-center justify-center relative">
      <UProgress animation="carousel" class="w-32 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <img :key="imageSrc" :src="imageSrc" class="z-10 w-full h-full object-contain">
    </div>
    <div class="flex-2">
      <div v-if="files?.length" class="flex overflow-scroll gap-2 mt-4">
        <UCard
          v-for="file of files"
          :key="file.pathname"
          :ui="{
            body: {
              base: 'space-y-0',
              padding: ''
            }
          }"
          class="overflow-hidden relative h-32 w-32 cursor-pointer"
          @click="source = file.pathname"
        >
          <img v-if="file.contentType?.startsWith('image/')" :src="`/api/blob/${file.pathname}`" class="h-32 w-32 object-cover">
        </UCard>
      </div>
      <UAlert v-else title="You don't have any files yet." />
    </div>
  </UCard>
</template>
