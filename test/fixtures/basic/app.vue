<script setup lang="ts">
const { data: primitives } = useFetch('/api/_hub/primitives')
</script>

<template>
  <h3>Primitives enabled:</h3>
  <ul>
    <li v-for="primitive in Object.keys(primitives)" :key="primitive">
      {{ primitive }}
    </li>
  </ul>
</template>
