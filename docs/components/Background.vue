<script setup lang="ts">
const points = useState(() => new Array(16).fill(0).map(() => [Math.random(), Math.random()]))

const poly = computed(() => points.value.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(', '))

function jumpVal(val: number) {
  return Math.random() > 0.5 ? val + (Math.random() - 0.5) / 2 : Math.random()
}

let timeout: any
function jumpPoints() {
  for (let i = 0; i < points.value.length; i++) {
    points.value[i] = [jumpVal(points.value[i][0]), jumpVal(points.value[i][1])]
  }
  timeout = setTimeout(jumpPoints, 2000 + Math.random() * 1000)
}

onMounted(() => {
  setTimeout(() => jumpPoints(), 1000)
  onUnmounted(() => timeout && clearTimeout(timeout))
})
</script>

<template>
  <div
    class="bg absolute inset-0 -z-10 transform-gpu blur-3xl overflow-hidden pointer-events-none"
    aria-hidden="true"
  >
    <div
      class="aspect-[1.7] w-full h-full bg-gradient-to-r from-[rgb(var(--color-primary-DEFAULT))] to-white/10 opacity-50"
      :style="{ 'clip-path': `polygon(${poly})` }"
    />
  </div>
</template>

<style scoped>
.bg > div {
  clip-path: circle(75%);
  transition: clip-path 3s;
}

.light .bg > div {
  opacity: 1 !important;
}
</style>
