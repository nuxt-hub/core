import { NuxtImg } from '#components'

// Add them to main entry (useful for content usage)
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('NuxtImg', NuxtImg)
})
