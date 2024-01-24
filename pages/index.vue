<script setup lang="ts">
const host = useRequestURL().host
let hosting = { url: 'https://pages.cloudflare.com', title: 'CloudFlare Pages' }
if (host.includes('.netlify.app')) {
  hosting = { url: 'https://www.netlify.com/products/#netlify-edge-functions', title: 'Netlify Edge Functions' }
} else if (host.includes('.vercel.app')) {
  hosting = { url: 'https://vercel.com/features/edge-functions', title: 'Vercel Edge Functions' }
} else if (host.includes('.lagon.dev')) {
  hosting = { url: 'https://lagon.app', title: 'Lagon' }
} else if (host.includes('.deno.dev')) {
  hosting = { url: 'https://deno.com/deploy', title: 'Deno Deploy' }
}
const isD1 = host.includes('nuxt-todos-edge.pages.dev')
const { loggedIn } = useUserSession()
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold leading-6">
        Todo List
      </h3>
      <UButton
        v-if="!loggedIn"
        to="/api/auth/github"
        icon="i-simple-icons-github"
        label="Login with GitHub"
        color="black"
        external
      />
      <UButton
        v-else
        to="/todos"
        icon="i-heroicons-list-bullet"
        label="Go to Todos"
        color="black"
      />
    </template>
    <p class="font-medium">
      Welcome to Nuxt Todos Edge.
    </p>
    <p>
      A <a href="https://nuxt.com" target="_blank" class="text-primary-500" rel="noopener">Nuxt</a> demo hosted on <a :href="hosting.url" target="_blank" rel="noopener" class="text-primary-500">{{ hosting.title }}</a> with server-side rendering on the edge and using <NuxtLink
        :href="isD1 ? 'https://developers.cloudflare.com/d1/' : 'https://turso.tech'"
        target="_blank"
        rel="noopener"
        class="text-primary-500"
      >
        {{ isD1 ? 'D1' : 'Turso' }} database
      </NuxtLink>.
    </p>
    <hr class="dark:border-gray-700">
    <p class="text-sm text-gray-700 dark:text-gray-300 italic">
      No personal informations regarding your GitHub account are stored in database.<br>
      We store only the todos created linked with your GitHub ID.
    </p>
  </UCard>
</template>
