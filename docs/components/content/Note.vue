<template>
  <Alert
    title="Note"
    icon="i-ph-info-duotone"
    color="blue"
    class="_note"
    :class="$attrs.to ? 'dark:hover:!border-blue-600/50 hover:!border-blue-400/50' : ''"
  >
    <ContentSlot :use="$slots.default" unwrap="p" />
  </Alert>
</template>

<style lang="postcss">
._note {
  @apply prose-a:text-blue-500 hover:prose-a:border-blue-500 !bg-blue-200/40 !border-blue-400/30 prose-code:text-blue-700 text-blue-900;
  @apply dark:!border-blue-600 dark:prose-a:text-blue-400 dark:hover:prose-a:border-blue-400 dark:!bg-blue-900/70 dark:text-blue-200 dark:prose-code:text-blue-200;
  a code {
    @apply hover:!text-blue-600 hover:!border-blue-400;
    @apply dark:hover:!text-blue-400 dark:hover:!border-blue-400;
  }
}
</style>
