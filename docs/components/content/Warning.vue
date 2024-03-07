<template>
  <Alert
    title="Warning"
    icon="i-ph-warning-duotone"
    color="amber"
    class="_warning"
    :class="$attrs.to ? 'dark:hover:!border-amber-600/50 hover:!border-amber-400/50' : ''"
  >
    <ContentSlot :use="$slots.default" unwrap="p" />
  </Alert>
</template>

<style lang="postcss">
._warning {
  @apply prose-a:text-amber-500 hover:prose-a:border-amber-500 !bg-amber-200/40 !border-amber-400/30 prose-code:text-amber-700 text-amber-900;
  @apply dark:!border-amber-600/80 dark:prose-a:text-amber-400 dark:hover:prose-a:border-amber-400 dark:!bg-amber-800/50 dark:text-amber-200 dark:prose-code:text-amber-200;
  a code {
    @apply hover:!text-amber-600 hover:!border-amber-400;
    @apply dark:hover:!text-amber-400 dark:hover:!border-amber-400;
  }
}
</style>
