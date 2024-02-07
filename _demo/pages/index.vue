<script setup lang="ts">
const { auth } = useHub()
const { user } = useUserSession()
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold leading-6">
        Todo List
      </h3>
      <UButton
        v-if="!user" icon="i-simple-icons-github" label="Login with GitHub" color="black" external
        @click="auth.loginWith('github')"
      />
      <div v-else class="space-x-2">
        <UButton to="/todos" icon="i-heroicons-list-bullet" label="Go to Todos" color="black" />
        <UButton to="/notes" icon="i-heroicons-pencil-square" label="Go to Notes" color="black" />
        <UButton to="/storage" icon="i-heroicons-document" label="Go to Storage" color="black" />
      </div>
    </template>
    <p class="font-medium">
      Welcome to NuxtHub Demo
    </p>
    <hr class="dark:border-gray-700">
    <p class="text-sm text-gray-700 dark:text-gray-300 italic">
      No personal informations regarding your GitHub account are stored in database.<br>
      We store only the todos created linked with your GitHub ID.
    </p>
  </UCard>
</template>
